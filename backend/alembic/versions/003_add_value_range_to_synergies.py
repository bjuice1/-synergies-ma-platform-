"""add value_low and value_high to synergies

Revision ID: 003
Revises: 002
Create Date: 2026-02-17 15:34:43

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    """Add value_low and value_high columns to synergies table."""
    # Add new columns for value ranges
    op.add_column('synergies', sa.Column('value_low', sa.BigInteger(), nullable=True))
    op.add_column('synergies', sa.Column('value_high', sa.BigInteger(), nullable=True))

    # Convert estimated_value from Float to BigInteger
    # Note: In SQLite, this requires recreating the table. In PostgreSQL, use ALTER COLUMN TYPE.
    # For now, we'll add a comment that this migration may need adjustment for PostgreSQL
    with op.batch_alter_table('synergies') as batch_op:
        batch_op.alter_column('estimated_value',
                              existing_type=sa.Float(),
                              type_=sa.BigInteger(),
                              existing_nullable=True)


def downgrade():
    """Remove value_low and value_high columns."""
    op.drop_column('synergies', 'value_high')
    op.drop_column('synergies', 'value_low')

    # Revert estimated_value back to Float
    with op.batch_alter_table('synergies') as batch_op:
        batch_op.alter_column('estimated_value',
                              existing_type=sa.BigInteger(),
                              type_=sa.Float(),
                              existing_nullable=True)
