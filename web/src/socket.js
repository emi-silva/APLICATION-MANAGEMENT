import { io } from 'socket.io-client';

export function createSocket() {
  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const url = `${protocol}://${host}:4000`;
  const socket = io(url, {
    transports: ['websocket'],
    autoConnect: false,
  });
  return socket;
}
