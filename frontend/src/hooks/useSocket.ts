import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(BACKEND_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      if (reason !== 'io client disconnect') {
        toast.error('Connection lost. Reconnecting...', { id: 'socket-disconnect' });
      }
    });

    socket.on('connect_error', () => {
      toast.error('Unable to connect to server.', { id: 'socket-error' });
    });

    socket.on('reconnect', () => {
      toast.success('Reconnected!', { id: 'socket-reconnect' });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
    };
  }, []);

  const emit = useCallback(<T>(event: string, data?: T) => {
    socketRef.current.emit(event, data);
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketRef.current.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}
