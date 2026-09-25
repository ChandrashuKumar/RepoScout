import { createClient } from 'redis';
import 'dotenv/config';

const redisUrl = process.env.REDIS_URL;

const makeClient = (url: string) => createClient({ url });
type RedisClient = ReturnType<typeof makeClient>;

// Pub/Sub takes over a connection, so publishing and subscribing need separate clients.
export let publisher: RedisClient | null = null;
export let subscriber: RedisClient | null = null;

export const isRedisEnabled = (): boolean => publisher !== null && subscriber !== null;

export const connectRedis = async () => {
    if (!redisUrl) {
        console.warn('[Redis] REDIS_URL not set. Using in-memory progress events (single instance only).');
        return;
    }

    const pub = makeClient(redisUrl);
    const sub = makeClient(redisUrl);

    pub.on('error', (err) => console.error('[Redis] Publisher error:', err.message));
    sub.on('error', (err) => console.error('[Redis] Subscriber error:', err.message));

    await Promise.all([pub.connect(), sub.connect()]);

    publisher = pub;
    subscriber = sub;
    console.log('[Redis] Connected. Using Redis pub/sub for progress events.');
};

export const closeRedis = async () => {
    await Promise.all([
        publisher?.close().catch(() => { }),
        subscriber?.close().catch(() => { }),
    ]);
    publisher = null;
    subscriber = null;
};
