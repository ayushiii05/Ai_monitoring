# AI Property Market Monitor

A professional, 24/7 autonomous property market monitoring system that tracks real estate listings, detects exact price changes and status updates, generates AI market insights, and pushes severity-based alerts to a centralized React analytics dashboard.

## Architecture

The system is completely decoupled from any specific source real estate platform, functioning entirely via APIs and a background worker.

```
Market Data APIs → (Normalization) → Supabase Database
                                          ↓
[Monitoring Engine 24/7 Worker] ←→ Supabase Database
                                          ↓
                                 (Change Detection)
                                          ↓
                                   [Market Events]
                                          ↓
                                 [Alerts Engine] & [AI Service]
                                          ↓
[Node.js / Express Backend API] ←→ [React.js Frontend Dashboard]
```

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express, node-cron
- **Database**: Supabase (PostgreSQL)

## Database Setup

1. Create a [Supabase](https://supabase.com/) project.
2. Go to the SQL Editor and run the migration scripts located in `backend/migrations/` sequentially:
   - `phase2_monitoring_tables.sql`
   - `phase5_market_events.sql`
   - `phase6_ai_insights.sql`
   - `phase7_market_alerts.sql`

## Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Environment Variables

Create a `.env` file in the **root** folder (`property-market-monitor/.env`). 

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Make it available to Vite as well
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY
```

## Running the Application

This is a monolithic repository where the backend runs both the REST API and the 24/7 background worker.

### Start the Backend (API & Worker)
```bash
cd backend
npm start
```
*The server will start on port 8000 and the Monitoring Engine will immediately begin its 24/7 cycle.*

### Start the Frontend
```bash
cd frontend
npm run dev
```
*The dashboard will be available at http://localhost:5173*

## API Documentation

- `GET /api/listings` - Returns monitored properties.
- `GET /api/events` - Returns raw market change events.
- `GET /api/alerts` - Returns severity-based market alerts.
- `GET /api/ai/insights` - Returns generated AI market insights.
- `GET /api/analytics/overview` - Returns top-level aggregated market stats.
- `GET /api/analytics/activity` - Returns time-series event data.
- `GET /api/monitoring/status` - Returns the health of the 24/7 worker.

## Dashboard Modules
1. **Overview**: Real-time stats and time-series charts.
2. **Property Monitor**: Live tracking table of every listing.
3. **Intelligence**: Suburb-specific deep dives and AI insights.
4. **Alerts**: A centralized notification feed of critical market changes.
5. **System Health**: Visibility into the background worker and sync logs.
