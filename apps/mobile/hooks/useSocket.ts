import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import * as SecureStore from 'expo-secure-store';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

export function useSocket(namespace: string = '/'): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      const token = await SecureStore.getItemAsync('accessToken');

      const socket = io(`${SOCKET_URL}${namespace}`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        if (mounted) setIsConnected(true);
        console.log(`Socket connected: ${namespace}`);
      });

      socket.on('disconnect', (reason) => {
        if (mounted) setIsConnected(false);
        console.log(`Socket disconnected (${namespace}): ${reason}`);
      });

      socket.on('connect_error', (error) => {
        console.error(`Socket connection error (${namespace}):`, error.message);
        // If auth error, try to refresh token and reconnect
        if (error.message === 'INVALID_TOKEN' || error.message === 'AUTHENTICATION_REQUIRED') {
          SecureStore.getItemAsync('accessToken').then((newToken) => {
            if (newToken && socket.auth) {
              (socket.auth as Record<string, string>).token = newToken;
            }
          });
        }
      });

      socketRef.current = socket;
    };

    connect();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [namespace]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit,
  };
}
