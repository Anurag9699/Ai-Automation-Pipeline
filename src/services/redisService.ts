import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

// Instantiate Redis strictly if URL is available. Otherwise, fallback to an in-memory Set.
const redis = REDIS_URL ? new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null // Stop retrying on failure
}) : null;

let hasWarned = false;
redis?.on('error', (err) => {
    if (!hasWarned) {
        console.warn('Redis connection error (Ensure Redis is running or remove REDIS_URL from .env):', err.message);
        console.warn('Falling back to in-memory cache.');
        hasWarned = true;
    }
});

// Fallback in-memory cache if Redis is not running
const inMemoryCache = new Set<string>();

export const isDuplicate = async (url: string): Promise<boolean> => {
    if (redis && redis.status === 'ready') {
        try {
            const exists = await redis.get(`news:${url}`);
            return !!exists;
        } catch {
            return inMemoryCache.has(url);
        }
    }
    return inMemoryCache.has(url);
};

export const markAsProcessed = async (url: string): Promise<void> => {
    if (redis && redis.status === 'ready') {
        try {
            // Set to expire after 7 days (60 * 60 * 24 * 7 seconds)
            await redis.set(`news:${url}`, '1', 'EX', 604800);
            return;
        } catch {
            inMemoryCache.add(url);
        }
    }
    inMemoryCache.add(url);
};
