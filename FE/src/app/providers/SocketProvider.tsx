
// src/app/providers/SocketProvider.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/features/auth/utils/authStorage";
import { useAuth } from "./AuthProvider";
import { ENV } from "@/config/env";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  emit: <T = unknown>(event: string, payload?: T) => void;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const SocketContext = createContext<SocketContextValue | undefined>(undefined);
SocketContext.displayName = "SocketContext";

/* -------------------------------------------------------------------------- */
/* Socket Factory                                                             */
/* -------------------------------------------------------------------------- */

function createSocket(): Socket {
  return io(ENV.SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],

    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,

    auth: (cb) => {
      cb({
        token: getAccessToken() ?? "",
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function SocketProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const { isAuthenticated } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const mountedRef = useRef(true);
  const connectErrorCount = useRef(0);

  /* ---------------------------------------------------------------------- */
  /* Cleanup                                                                */
  /* ---------------------------------------------------------------------- */

  const destroySocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.removeAllListeners();
    socket.disconnect();

    socketRef.current = null;
    setIsConnected(false);
    connectErrorCount.current = 0;
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Lifecycle                                                              */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      destroySocket();
      return;
    }

    if (!socketRef.current) {
      socketRef.current = createSocket();
    }

    const socket = socketRef.current;

    const onConnect = () => {
      connectErrorCount.current = 0;
      if (mountedRef.current) setIsConnected(true);
    };

    const onDisconnect = () => {
      if (mountedRef.current) setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      connectErrorCount.current += 1;

      if (import.meta.env.DEV && connectErrorCount.current === 1) {
        console.warn("[Socket] connect_error:", err.message);
      }
    };

    const onReconnectFailed = () => {
      if (import.meta.env.DEV) {
        console.warn("[Socket] reconnect failed after max attempts");
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("reconnect_failed", onReconnectFailed);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("reconnect_failed", onReconnectFailed);

      destroySocket();
    };
  }, [isAuthenticated, destroySocket]);

  /* ---------------------------------------------------------------------- */
  /* Emit                                                                   */
  /* ---------------------------------------------------------------------- */

  const emit = useCallback(<T = unknown,>(event: string, payload?: T) => {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      if (import.meta.env.DEV) {
        console.warn(`[Socket] emit blocked (${event}) — not connected`);
      }
      return;
    }

    socket.emit(event, payload);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Stable Context Value                                                   */
  /* ---------------------------------------------------------------------- */

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: socketRef.current,
      isConnected,
      emit,
    }),
    [isConnected, emit],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error("[useSocket] must be used inside <SocketProvider>");
  }

  return ctx;
}