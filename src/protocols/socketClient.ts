// src/protocols/socketClient.ts

import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

const sockets: Record<string, Socket> = {};

/**
 * Returns a persistent Socket.IO client for a given server URL.
 * Auth object is passed for handshake authentication.
 */
export function getSocket(url: string, auth?: any): Socket {
  if (!sockets[url]) {
    sockets[url] = io(url, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'],
      auth
    } as Partial<ManagerOptions & SocketOptions>);
  }
  return sockets[url];
}

/**
 * Calls a socket.io event and expects callback response.
 */
export function callSocket(
  socket: Socket,
  event: string,
  payload: any,
  timeoutMs = 10000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    let timeout: any;

    socket.emit(event, payload, (response: any) => {
      clearTimeout(timeout);
      if (response && response.error) {
        return reject(new Error(response.error));
      }
      resolve(response);
    });

    timeout = setTimeout(() => reject(new Error('Socket timeout')), timeoutMs);
  });
}
