import { createClient, RedisClientType } from "redis";

class RedisWrapper {
  private _client?: RedisClientType;

  get client() {
    if (!this._client) throw new Error("Redis client not connected");
    return this._client;
  }

  async connect(urlOrPassword: string) {
    const url =
      urlOrPassword.startsWith("redis://")
        ? urlOrPassword
        : `redis://:${urlOrPassword}@redis:6379`;

    this._client = createClient({ url });

    this._client.on("error", (err) => {
      console.error("[Redis] client error:", err);
    });

    await this._client.connect();
    console.log("✅ Connected to Redis");
  }

  async disconnect() {
    if (this._client) {
      await this._client.quit();
      console.log("⬇️ Disconnected Redis");
    }
  }
}

export const redisWrapper = new RedisWrapper();

export const connectRedisWithRetry = async (
  urlOrPassword: string,
  retries = 20,
  delayMs = 1500
) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await redisWrapper.connect(urlOrPassword);
      return;
    } catch (e) {
      console.warn(`Redis not ready (attempt ${i}/${retries})`);
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};
