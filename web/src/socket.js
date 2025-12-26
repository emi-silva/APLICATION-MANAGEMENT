import { io } from 'socket.io-client';

export function createSocket() {
  const envUrl = import.meta.env.VITE_API_URL || '';
  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const fallbackUrl = `${protocol}://${host}:4000`;
  const url = envUrl ? envUrl.replace(/\/$/, '') : fallbackUrl;
  const socket = io(url, {
    transports: ['websocket'],
    autoConnect: false,
  });
  return socket;
}
