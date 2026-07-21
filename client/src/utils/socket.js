import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (socket) return socket;

  const token = localStorage.getItem('ync_token');
  if (!token) return null;

  // Use explicit API URL if set, otherwise derive from current origin (works when Express serves both)
  const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;

  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
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
    console.error('Socket connection error:', err.message);
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
