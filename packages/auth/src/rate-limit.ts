import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(prefix: string, limit: number, window: Window): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  const key = `${prefix}:${limit}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix,
      })
    );
  }
  return limiters.get(key)!;
}

export function getIp(request?: Request): string {
  const fwd = request?.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

export async function rateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  window: Window
): Promise<boolean> {
  const limiter = getLimiter(prefix, limit, window);
  if (!limiter) return true;
  const res = await limiter.limit(`${prefix}:${identifier}`);
  return res.success;
}
