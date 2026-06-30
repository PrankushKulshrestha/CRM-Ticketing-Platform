
import mongoose, { type ConnectOptions, type Mongoose } from "mongoose";
import { env, isDevelopment } from "./env";
import logger from "./logger";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface DatabaseHealth {
  connected: boolean;
  readyState: number;
  host: string;
  database: string;
}

/* -------------------------------------------------------------------------- */
/* Connection State                                                           */
/* -------------------------------------------------------------------------- */

let connectionPromise: Promise<Mongoose> | null = null;

/* -------------------------------------------------------------------------- */
/* MongoDB Configuration                                                      */
/* -------------------------------------------------------------------------- */

const mongooseOptions: ConnectOptions = {
  autoIndex: isDevelopment,

  maxPoolSize: 20,
  minPoolSize: 5,

  connectTimeoutMS: 10_000,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,

  retryWrites: true,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isConnected = (): boolean => mongoose.connection.readyState === 1;
const isConnecting = (): boolean => mongoose.connection.readyState === 2;

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

function registerDatabaseEvents(): void {
  const conn = mongoose.connection;

  conn.on("connected", () => {
    logger.info("[DB_CONNECTED]");
  });

  conn.on("disconnected", () => {
    logger.warn("[DB_DISCONNECTED]");
  });

  conn.on("error", (err) => {
    logger.error("[DB_ERROR]", {
      message: err.message,
    });
  });

  conn.on("reconnected", () => {
    logger.info("[DB_RECONNECTED]");
  });
}

/* -------------------------------------------------------------------------- */
/* Connect Database                                                           */
/* -------------------------------------------------------------------------- */

export async function connectDB(): Promise<Mongoose> {
  if (isConnected()) return mongoose;

  if (connectionPromise) return connectionPromise;

  if (isConnecting()) {
    await mongoose.connection.asPromise();
    return mongoose;
  }

  mongoose.set("strictQuery", true);
  mongoose.set("debug", isDevelopment);

  registerDatabaseEvents();

  connectionPromise = mongoose.connect(
    env.database.mongoUri,
    mongooseOptions
  );

  try {
    await connectionPromise;

    logger.info("[DB_CONNECTION_SUCCESS]", {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });

    return mongoose;
  } catch (err) {
    logger.error("[DB_CONNECTION_FAILED]", {
      message: err instanceof Error ? err.message : String(err),
    });

    throw err;
  } finally {
    connectionPromise = null;
  }
}

/* -------------------------------------------------------------------------- */
/* Disconnect Database                                                        */
/* -------------------------------------------------------------------------- */

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.connection.close();

  logger.info("[DB_DISCONNECTED]");
}

/* -------------------------------------------------------------------------- */
/* Health Check                                                               */
/* -------------------------------------------------------------------------- */

export function getDatabaseHealth(): DatabaseHealth {
  return {
    connected: isConnected(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || "",
    database: mongoose.connection.name || "",
  };
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export default mongoose;