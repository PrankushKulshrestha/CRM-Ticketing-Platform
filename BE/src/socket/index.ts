
// src/socket/index.ts

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { env } from "@/config/env";
import logger from "@/config/logger";

/*
|--------------------------------------------------------------------------
| Socket State (Singleton)
|--------------------------------------------------------------------------
*/

let io: SocketIOServer | null = null;

/*
|--------------------------------------------------------------------------
| Socket Initialization
|--------------------------------------------------------------------------
*/

export function initSocket(server: HTTPServer): SocketIOServer {
  if (io) {
    logger.warn("[SOCKET_INIT_SKIPPED] Already initialized");
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: env.app.clientUrl,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  registerGlobalHandlers(io);

  logger.info("[SOCKET_INIT] Socket server initialized");

  return io;
}

/*
|--------------------------------------------------------------------------
| Global Event Handlers
|--------------------------------------------------------------------------
*/

function registerGlobalHandlers(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    logger.info("[SOCKET_CONNECTED]", {
      socketId: socket.id,
    });

    registerSocketHandlers(socket);

    socket.on("disconnect", (reason) => {
      logger.info("[SOCKET_DISCONNECTED]", {
        socketId: socket.id,
        reason,
      });
    });
  });
}

/*
|--------------------------------------------------------------------------
| Per-Socket Events
|--------------------------------------------------------------------------
*/

function registerSocketHandlers(socket: Socket): void {
  socket.on("ping", () => {
    socket.emit("pong", {
      timestamp: Date.now(),
    });
  });
}

/*
|--------------------------------------------------------------------------
| Get Socket Instance
|--------------------------------------------------------------------------
*/

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("[SOCKET_ERROR] Socket.IO has not been initialized");
  }
  return io;
}

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

export function shutdownSocket(): void {
  if (!io) return;

  logger.info("[SOCKET_SHUTDOWN] Closing Socket.IO server...");

  io.close(() => {
    logger.info("[SOCKET_SHUTDOWN_COMPLETE] Socket server closed");
  });

  io = null;
}