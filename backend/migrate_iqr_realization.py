"""
One-time migration: add IQR + realization columns to deal_levers, backfill existing rows.

Run with DATABASE_URL set:
  DATABASE_URL=postgresql://... python backend/migrate_iqr_realization.py

Safe to re-run — uses ADD COLUMN IF NOT EXISTS and recalculates all rows idempotently.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.app import create_app
from backend.extensions import db
from backend.app.models.lever import DealLever, BenchmarkDataPoint


def _percentile(data, p):
    """Linear interpolation percentile on a sorted list."""
    if not data:
        return None
    idx = (len(data) - 1) * p / 100
    lo = int(idx)
    hi = min(lo + 1, len(data) - 1)
    return round(data[lo] + (data[hi] - data[lo]) * (idx - lo), 2)


def run():
    app = create_app()
    with app.app_context():
        print("Adding new columns (idempotent)...")
        with db.engine.connect() as conn:
            stmts = [
                "ALTER TABLE deal_levers ADD COLUMN IF NOT EXISTS benchmark_pct_p25 FLOAT",
                "ALTER TABLE deal_levers ADD COLUMN IF NOT EXISTS benchmark_pct_p75 FLOAT",
                "ALTER TABLE deal_levers ADD COLUMN IF NOT EXISTS realization_factor FLOAT DEFAULT 0.75",
                "ALTER TABLE deal_levers ADD COLUMN IF NOT EXISTS realizable_value_low BIGINT",
                "ALTER TABLE deal_levers ADD COLUMN IF NOT EXISTS realizable_value_high BIGINT",
            ]
            for s in stmts:
                conn.execute(text(s))
            conn.commit()
        print("  ✓ Columns ready")

        print("Backfilling existing DealLever rows...")
        updated = 0
        skipped = 0

        for dl in DealLever.query.all():
            pct_values = sorted([
                row[0] for row in
                db.session.query(BenchmarkDataPoint.synergy_pct)
                .filter(BenchmarkDataPoint.lever_id == dl.lever_id)
                .all()
            ])

            if not pct_values:
                skipped += 1
                continue

            p25 = _percentile(pct_values, 25)
            p75 = _percentile(pct_values, 75)

            dl.benchmark_pct_p25 = p25
            dl.benchmark_pct_p75 = p75
            dl.realization_factor = 0.75

            # Recalculate combined revenue for this deal
            rev = 0
            if dl.deal and dl.deal.acquirer and dl.deal.acquirer.revenue_usd:
                rev += dl.deal.acquirer.revenue_usd
            if dl.deal and dl.deal.target and dl.deal.target.revenue_usd:
                rev += dl.deal.target.revenue_usd

            if rev and p25 is not None and p75 is not None:
                dl.calculated_value_low  = int(rev * p25 / 100)
                dl.calculated_value_high = int(rev * p75 / 100)
                dl.realizable_value_low  = int(dl.calculated_value_low  * 0.75)
                dl.realizable_value_high = int(dl.calculated_value_high * 0.75)

            updated += 1

        db.session.commit()
        print(f"  ✓ Updated {updated} rows, skipped {skipped} (no benchmark data)")
        print("Migration complete.")


if __name__ == '__main__':
    run()
