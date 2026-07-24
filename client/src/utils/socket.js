import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (socket) return socket;

  // Allow disabling socket entirely via env var
  if (import.meta.env.VITE_ENABLE_SOCKET === 'false') return null;

  // Auto-detect Vercel — WebSocket/real-time connections don't work on serverless
  if (window.location.hostname.includes('vercel.app')) return null;

  const token = localStorage.getItem('ync_token');
  if (!token) return null;

  // Use explicit API URL if set, otherwise derive from current origin
  const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;

  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 3,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket = null;
    }
  });

  socket.on('connect_error', (err) => {
    if (import.meta.env.DEV) {
      console.warn('Socket connection unavailable:', err.message);
    }
    socket = null;
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
