import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook để quản lý WebSocket connection
 * @param {string} url - WebSocket URL
 * @param {object} options - { reconnect, maxReconnectAttempts, reconnectInterval }
 * @returns { data, isConnected, error, send, disconnect }
 */
export const useWebSocket = (url, options = {}) => {
  const {
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectCountRef = useRef(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket connected:", url);
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(message);
        } catch (e) {
          // If not JSON, store raw data
          setData(event.data);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection failed");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnect && reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
      setError(err.message);
    }
  }, [url, reconnect, maxReconnectAttempts, reconnectInterval]);

  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        typeof message === "string" ? message : JSON.stringify(message),
      );
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    send,
    disconnect,
  };
};
