import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { handleSocketConnection, registerPollEndCallback } from './socket/poll.socket';
import { restoreActiveTimer } from './services/poll.service';

const PORT = parseInt(process.env.PORT!, 10);
const FRONTEND_URL = process.env.FRONTEND_URL!;

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

// Register the poll-end callback so the service layer can notify sockets
registerPollEndCallback(io);

// Restore any active poll timer that survived a restart
restoreActiveTimer().catch(() => {
  // Timer restoration failed
});

// Handle each new socket connection
io.on('connection', (socket) => {
  handleSocketConnection(io, socket);
});

httpServer.listen(PORT, () => {
  // Server started
});
