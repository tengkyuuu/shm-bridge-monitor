import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import health from './routes/health.js';
import ingest from './routes/ingest.js';
import exportRoutes from './routes/export.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins }));
app.use(express.json({ limit: '64kb' }));

app.use('/api/health', health);
app.use('/api/ingest', ingest);
app.use('/api/export', exportRoutes);

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`[shm-api] listening on :${port}`);
});
