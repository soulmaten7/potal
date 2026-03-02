import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import * as SecureStore from 'expo-secure-store';

export function useSocket(namespace: string = '/') {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const connect = async () => {
      const token = await SecureStore.getItemAsync('accessToken');
      socketRef.current = io(`${SOCKET_URL}${namespace}`, {
        auth: { token },
        transports: ['websocket'],
      });
    };
    connect();
    return () => { socketRef.current?.disconnect(); };
  }, [namespace]);

  return socketRef;
}
