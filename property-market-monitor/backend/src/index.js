import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import listingsRouter from './routes/listings.js';
import monitoringRouter from './routes/monitoring.js';
import eventsRouter from './routes/events.js';
import aiRouter from './routes/ai.js';
import alertsRouter from './routes/alerts.js';
import analyticsRouter from './routes/analytics.js';
import { MonitoringEngine } from './market_data/engine.js';

dotenv.config();
dotenv.config({ path: '../.env' }); // Load .env from root

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', listingsRouter);
app.use('/api', monitoringRouter);
app.use('/api', eventsRouter);
app.use('/api', aiRouter);
app.use('/api', alertsRouter);
app.use('/api', analyticsRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start the background monitoring engine
  const engine = new MonitoringEngine();
  engine.start();
});
