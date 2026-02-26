import express from 'express';
import cors from 'cors';
import pollRoutes from './routes/poll.routes';

const app = express();

// CORS — allow the frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/polls', pollRoutes);

export default app;
