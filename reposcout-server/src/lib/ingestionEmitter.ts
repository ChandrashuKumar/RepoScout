import { EventEmitter } from 'events';
import { publisher, subscriber, isRedisEnabled } from './redis';

export interface IngestionProgress {
    message: string
    progress: number
    eta: string | null
    timestamp: string
}

type ProgressHandler = (data: IngestionProgress) => void;

// Fallback when REDIS_URL is not set. Only works when the job and the SSE
// connection are on the same instance.
const localEvents = new EventEmitter();

const channelFor = (repoId: string) => `ingest-progress:${repoId}`;

export const publishProgress = async (repoId: string, data: IngestionProgress) => {
    const channel = channelFor(repoId);

    if (!isRedisEnabled()) {
        localEvents.emit(channel, data);
        return;
    }

    try {
        await publisher!.publish(channel, JSON.stringify(data));
    } catch (err: any) {
        console.error(`[Progress] Failed to publish to ${channel}:`, err.message);
    }
};

// Returns a function that removes the subscription.
export const subscribeProgress = async (repoId: string, handler: ProgressHandler): Promise<() => Promise<void>> => {
    const channel = channelFor(repoId);

    if (!isRedisEnabled()) {
        localEvents.on(channel, handler);
        return async () => {
            localEvents.off(channel, handler);
        };
    }

    const listener = (message: string) => {
        try {
            handler(JSON.parse(message));
        } catch (err) {
            console.error(`[Progress] Invalid message on ${channel}:`, err);
        }
    };

    const sub = subscriber!;
    await sub.subscribe(channel, listener);

    return async () => {
        try {
            await sub.unsubscribe(channel, listener);
        } catch (err: any) {
            console.error(`[Progress] Failed to unsubscribe from ${channel}:`, err.message);
        }
    };
};
