import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/env.js';

export function createSocket() {
  return io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    autoConnect: false,
  });
}
