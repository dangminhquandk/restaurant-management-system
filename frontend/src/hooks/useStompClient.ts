import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import type { StompConnectionState } from '../types/api';

export type StompTopic =
  | '/topic/tables'
  | '/topic/kds/orders'
  | '/topic/pos/notifications'
  | '/topic/menu/availability';

export function resolveWsBrokerUrl(configuredUrl = import.meta.env.VITE_WS_URL): string {
  if (
    configuredUrl &&
    (configuredUrl.startsWith('ws://') || configuredUrl.startsWith('wss://'))
  ) {
    return configuredUrl;
  }
  const normalizedPath = configuredUrl
    ? configuredUrl.startsWith('/')
      ? configuredUrl
      : `/${configuredUrl}`
    : '/ws';
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}${normalizedPath}`;
}

interface TopicListenerEntry {
  id: string;
  topic: StompTopic;
  callback: (payload: unknown, rawMessage: IMessage) => void;
}

interface UseStompClientOptions {
  token: string | null;
  enabled?: boolean;
  onReconnect?: () => void;
}

export interface StompClientController {
  connectionState: StompConnectionState;
  subscribeTopic: <T = unknown>(
    topic: StompTopic,
    handler: (payload: T) => void
  ) => () => void;
  registerReconnectListener: (listener: () => void) => () => void;
}

/**
 * Manages a resilient STOMP over WebSocket connection (/ws) with JWT auth,
 * 10s/10s heartbeats, 3s auto-reconnect, multiplexed topic subscriptions,
 * and automatic snapshot resync callbacks on reconnect (NFR-01, NFR-04).
 */
export function useStompClient({
  token,
  enabled = true,
  onReconnect,
}: UseStompClientOptions): StompClientController {
  const [connectionState, setConnectionState] = useState<StompConnectionState>('CONNECTING');

  const clientRef = useRef<Client | null>(null);
  const listenersRef = useRef<Map<string, TopicListenerEntry>>(new Map());
  const activeStompSubsRef = useRef<Map<StompTopic, StompSubscription>>(new Map());
  const reconnectListenersRef = useRef<Set<() => void>>(new Set());
  const onReconnectPropRef = useRef(onReconnect);
  onReconnectPropRef.current = onReconnect;

  const hasConnectedOnceRef = useRef(false);
  const hadDisconnectRef = useRef(false);

  const syncTopicSubscriptions = useCallback((client: Client) => {
    if (!client.connected) return;

    const neededTopics = new Set<StompTopic>();
    for (const entry of listenersRef.current.values()) {
      neededTopics.add(entry.topic);
    }

    // Unsubscribe topics that no longer have listeners
    for (const [topic, sub] of activeStompSubsRef.current.entries()) {
      if (!neededTopics.has(topic)) {
        try {
          sub.unsubscribe();
        } catch {
          // Ignore unsubscribe errors on closing socket
        }
        activeStompSubsRef.current.delete(topic);
      }
    }

    // Subscribe to newly requested topics
    for (const topic of neededTopics) {
      if (!activeStompSubsRef.current.has(topic)) {
        const sub = client.subscribe(topic, (frame: IMessage) => {
          let parsedBody: unknown = frame.body;
          try {
            parsedBody = frame.body ? JSON.parse(frame.body) : null;
          } catch {
            // Keep raw string body if non-JSON
          }
          for (const entry of listenersRef.current.values()) {
            if (entry.topic === topic) {
              entry.callback(parsedBody, frame);
            }
          }
        });
        activeStompSubsRef.current.set(topic, sub);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !token) {
      setConnectionState('DISCONNECTED');
      return;
    }

    setConnectionState('CONNECTING');
    hasConnectedOnceRef.current = false;
    hadDisconnectRef.current = false;
    const activeSubs = activeStompSubsRef.current;

    const client = new Client({
      brokerURL: resolveWsBrokerUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 3000,
      debug: () => {
        // Silence STOMP frame logs in production
      },
      onConnect: () => {
        activeSubs.clear();
        setConnectionState('CONNECTED');
        syncTopicSubscriptions(client);

        if (hasConnectedOnceRef.current && hadDisconnectRef.current) {
          hadDisconnectRef.current = false;
          onReconnectPropRef.current?.();
          for (const listener of reconnectListenersRef.current) {
            listener();
          }
        }
        hasConnectedOnceRef.current = true;
      },
      onStompError: () => {
        hadDisconnectRef.current = true;
        setConnectionState('DISCONNECTED');
      },
      onWebSocketClose: () => {
        activeSubs.clear();
        if (hasConnectedOnceRef.current) {
          hadDisconnectRef.current = true;
        }
        setConnectionState('DISCONNECTED');
      },
      onWebSocketError: () => {
        if (hasConnectedOnceRef.current) {
          hadDisconnectRef.current = true;
        }
        setConnectionState('DISCONNECTED');
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      activeSubs.clear();
      clientRef.current = null;
      void client.deactivate();
    };
  }, [token, enabled, syncTopicSubscriptions]);

  const subscribeTopic = useCallback(
    <T = unknown>(topic: StompTopic, handler: (payload: T) => void) => {
      const id = `${topic}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      listenersRef.current.set(id, {
        id,
        topic,
        callback: (payload) => handler(payload as T),
      });

      if (clientRef.current?.connected) {
        syncTopicSubscriptions(clientRef.current);
      }

      return () => {
        listenersRef.current.delete(id);
        if (clientRef.current?.connected) {
          syncTopicSubscriptions(clientRef.current);
        }
      };
    },
    [syncTopicSubscriptions]
  );

  const registerReconnectListener = useCallback((listener: () => void) => {
    reconnectListenersRef.current.add(listener);
    return () => {
      reconnectListenersRef.current.delete(listener);
    };
  }, []);

  return {
    connectionState,
    subscribeTopic,
    registerReconnectListener,
  };
}
