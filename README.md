# Synergies M&A Platform

AI-powered M&A deal management system with intelligent synergy identification and tracking.

## Overview

This platform helps M&A teams identify, quantify, and track synergy opportunities in acquisition deals. The AI-powered synergy generator analyzes deal context (company profiles, revenue, tech stacks, geographies) and automatically generates 5 types of synergies with value range estimates.

## Features

### Deal Management
- Create and track M&A deals with acquirer and target company details
- Store company profiles: revenue, employees, products, tech stack, strengths/weaknesses
- Track deal metrics: size, close date, strategic rationale
- Status tracking: draft, active, closed, cancelled

### AI Synergy Generation
Automatically identifies 5 types of synergies based on deal context:

1. **Cross-Sell Revenue Synergies** - Leverage acquirer's customer base to sell target's products (15-30% penetration)
2. **Cost Consolidation** - Eliminate duplicate corporate functions like HR, Finance, Legal, IT (10-15% of headcount)
3. **Technology Stack Consolidation** - Migrate to unified infrastructure and reduce licensing costs (20-40% savings)
4. **Product Integration** - Create bundled offerings with premium pricing (10-20% revenue uplift)
5. **Geographic Expansion** - Expand target's products into acquirer's geographies (30-50% revenue growth)

Each synergy includes:
- Value range (low/high estimates in USD)
- Confidence level (high/medium/low)
- Realization timeline (6-36 months)
- Detailed description and rationale

### Business Intelligence
- Workflow visualization and status tracking
- Metrics dashboard with deal and synergy analytics
- Audit trail for synergy status changes

---

## Tech Stack

### Backend
- **Framework**: Flask 3.1.0 with application factory pattern
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: SQLAlchemy 2.0 with relationship management
- **Migrations**: Alembic for schema versioning
- **Authentication**: JWT with role-based access control
- **API**: RESTful endpoints with JSON responses

### Frontend
- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Query (TanStack Query) for server state
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Data Visualization**: Chart.js for metrics

---

## Project Structure

```
.
├── backend/              # Flask API server
│   ├── app/
│   │   ├── models/      # SQLAlchemy models (Deal, Company, Synergy, User, Workflow)
│   │   ├── services/    # Business logic (synergy_generator, analytics)
│   │   ├── routes/      # API endpoints (deals, auth, metrics)
│   │   ├── auth/        # JWT authentication and role decorators
│   │   └── extensions/  # Database and other extensions
│   ├── alembic/         # Database migrations
│   │   └── versions/    # Migration scripts (001, 002, 003...)
│   └── utils/           # Utilities (exceptions, decorators)
├── frontend/            # Next.js application
│   ├── app/            # App router pages
│   │   ├── deals/      # Deal management pages
│   │   └── synergies/  # Synergy detail pages
│   ├── components/     # React components
│   │   ├── deals/      # Deal-specific components (DealForm, DealList)
│   │   └── ui/         # Reusable UI components (shadcn)
│   ├── hooks/          # Custom React hooks (useDeals, React Query)
│   └── lib/            # Utilities and API client
└── scripts/            # Deployment and validation scripts
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (for production) or SQLite (for development)

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration:
# DATABASE_URL=postgresql://user:pass@localhost/synergies
# SECRET_KEY=your-secret-key-here
# JWT_SECRET_KEY=your-jwt-secret-here
```

4. **Initialize database:**
```bash
# Run Alembic migrations
alembic upgrade head

# Or create tables directly (development only)
python3 -c "from backend.app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

5. **Start the server:**
```bash
python3 app.py
# API available at http://localhost:5001
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Add:
# NEXT_PUBLIC_API_URL=http://localhost:5001
```

3. **Start development server:**
```bash
npm run dev
# App available at http://localhost:3000
```

---

## API Endpoints

### Deals
- `GET /api/deals` - List all deals (with optional filters: status, acquirer_id, target_id)
- `POST /api/deals` - Create new deal
- `GET /api/deals/:id` - Get deal details with synergies
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal and associated synergies
- `POST /api/deals/:id/generate-synergies` - Generate synergies for deal (idempotent)

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current authenticated user

### Metrics (Business Intelligence)
- `GET /api/metrics/workflow-summary` - Workflow status counts
- `GET /api/metrics/deal-metrics` - Deal pipeline metrics

---

## Database Schema

### Core Models

**Deal**
- Tracks M&A transaction details
- Links to acquirer and target companies
- Has many synergies
- Fields: name, deal_type, deal_size_usd, close_date, status, strategic_rationale

**Company**
- Stores detailed company profile
- Fields: name, industry, description, revenue_usd, employees, geography[], products[], tech_stack[], strengths[], weaknesses[]

**Synergy**
- Identified synergy opportunity
- Links to deal and two companies
- Fields: synergy_type, description, value_low, value_high, estimated_value, confidence_level, realization_timeline, status

**Workflow**
- Tracks synergy approval state changes
- Fields: from_state, to_state, timestamp, actor

**User**
- System user with role-based access
- Fields: email, password_hash, full_name, role (viewer/analyst/admin)

---

## Deployment

### Railway Deployment

This application is designed for Railway deployment:

1. **Database**: Railway PostgreSQL
2. **Backend**: Python 3.11 with Gunicorn
3. **Frontend**: Next.js with automatic static optimization

Environment variables needed:
- `DATABASE_URL` - PostgreSQL connection string (provided by Railway)
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `FLASK_ENV` - production
- `NEXT_PUBLIC_API_URL` - Backend API URL

See deployment section below for detailed Railway setup instructions.

---

## Development Status

### Phase 1 (✅ Complete) - MVP with Rule-Based Synergies
- ✅ Core CRUD for deals and companies
- ✅ 5 synergy generation patterns implemented
- ✅ Value range estimation (low/high)
- ✅ Basic workflow tracking
- ✅ React Query integration
- ✅ TypeScript types for API contracts
- ✅ Authentication with JWT
- ✅ Role-based access control
- ✅ Database migrations with Alembic

### Phase 2 (Planned) - LLM-Powered Analysis
- AI-enhanced synergy identification using Claude/GPT-4
- Natural language rationale generation
- Risk assessment and mitigation strategies
- Integration recommendations
- Competitive analysis

### Phase 3 (Planned) - Advanced Features
- Scenario modeling (best/worst/likely case)
- Monte Carlo simulation for value ranges
- Integration timeline planning
- Stakeholder collaboration tools
- Document management for diligence materials

---

## Contributing

This is a proprietary project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved
