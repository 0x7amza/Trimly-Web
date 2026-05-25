import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

// Global cache to reuse connection across hot reloads in dev
const globalWithMongoose = global as typeof globalThis & {
  _mongooseCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = { conn: null, promise: null };
}

const cached = globalWithMongoose._mongooseCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
