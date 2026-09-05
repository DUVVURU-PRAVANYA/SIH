import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';
import { initWebSocketServer } from './realtime';
import { db } from './db/database';
import { seedDatabase } from './db/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend Vite dev server (port 5173 / localhost)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Check if database needs initial seeding
if (db.getRawData().hospitals.length === 0) {
  seedDatabase();
}

// Mount REST API
app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hospital: db.getHospital()?.name,
    version: '1.0.0-PROD',
  });
});

const server = http.createServer(app);

// Initialize WebSockets on the same server instance
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`\n===========================================================`);
  console.log(`🚀 GH-QueueFlow Backend Server running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Realtime Engine listening on ws://localhost:${PORT}/ws`);
  console.log(`🏥 Active Hospital: ${db.getHospital()?.name}`);
  console.log(`===========================================================\n`);
});
