import React, { createContext, useContext, useEffect, useRef } from 'react';
import {
  useStompClient,
  type StompClientController,
  type StompTopic,
} from '../hooks/useStompClient';
import { useAuth } from './AuthContext';

const FALLBACK_CONTROLLER: StompClientController = {
  connectionState: 'CONNECTING',
  subscribeTopic: () => () => undefined,
  registerReconnectListener: () => () => undefined,
};

const RealtimeContext = createContext<StompClientController>(FALLBACK_CONTROLLER);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const stomp = useStompClient({
    token,
    enabled: isAuthenticated,
  });

  return <RealtimeContext.Provider value={stomp}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): StompClientController {
  return useContext(RealtimeContext);
}

/**
 * Subscribes a component to a STOMP topic and optional reconnect snapshot callback.
 * Safe to call inside standalone unit tests even without RealtimeProvider.
 */
export function useStompSubscription<T = unknown>(
  topic: StompTopic,
  onMessage: (payload: T) => void,
  onReconnect?: () => void
) {
  const { subscribeTopic, registerReconnectListener, connectionState } = useRealtime();
  const messageRef = useRef(onMessage);
  messageRef.current = onMessage;

  const reconnectRef = useRef(onReconnect);
  reconnectRef.current = onReconnect;

  useEffect(() => {
    const unsubTopic = subscribeTopic<T>(topic, (payload) => {
      messageRef.current(payload);
    });

    const unsubReconnect = registerReconnectListener(() => {
      reconnectRef.current?.();
    });

    return () => {
      unsubTopic();
      unsubReconnect();
    };
  }, [topic, subscribeTopic, registerReconnectListener]);

  return { connectionState };
}
