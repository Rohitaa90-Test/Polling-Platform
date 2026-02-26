import 'dotenv/config';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import app from './app';
import { handleSocketConnection, registerPollEndCallback } from './socket/poll.socket';
import { restoreActiveTimer } from './services/poll.service';

console.log('[DEBUG] Starting server...');
console.log('[DEBUG] PORT:', process.env.PORT);
console.log('[DEBUG] FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);

const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('[DEBUG] Parsed PORT:', PORT);
console.log('[DEBUG] Using FRONTEND_URL:', FRONTEND_URL);

// --- HTTP + Socket.io setup ---
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 30_000, // 30 s buffer for brief disconnects
  },
});

console.log('[DEBUG] Socket.io configured');

// Register the poll-end callback so the service layer can notify sockets
registerPollEndCallback(io);

console.log('[DEBUG] Poll callback registered');

// Restore any active poll timer that survived a restart
restoreActiveTimer().catch((err) => {
  console.error('[DEBUG] Timer restoration failed:', err);
});

console.log('[DEBUG] Timer restoration initiated');

// Handle each new socket connection
io.on('connection', (socket) => {
  handleSocketConnection(io, socket);
});

console.log('[DEBUG] Socket handler registered');

httpServer.listen(PORT, () => {
  console.log(`[DEBUG] Server listening on port ${PORT}`);

  // --- Keep-alive ping for Render free tier ---
  // Render sleeps after 15 min of inactivity. Ping /health every 14 min to stay awake.
  if (process.env.NODE_ENV === 'production') {
    const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
    if (BACKEND_URL) {
      const pingUrl = `${BACKEND_URL}/health`;
      setInterval(() => {
        const client = pingUrl.startsWith('https') ? https : http;
        const req = client.get(pingUrl, (res) => {
          console.log(`[KEEP-ALIVE] Ping → ${res.statusCode}`);
        });
        req.on('error', (err) => {
          console.error('[KEEP-ALIVE] Ping failed:', err.message);
        });
        req.end();
      }, 14 * 60 * 1000); // every 14 minutes
      console.log(`[KEEP-ALIVE] Ping scheduled → ${pingUrl}`);
    } else {
      console.warn('[KEEP-ALIVE] RENDER_EXTERNAL_URL / BACKEND_URL not set — skipping ping.');
    }
  }
});

console.log('[DEBUG] Server setup complete');
