import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

// Instantiate Redis strictly if URL is available. Otherwise, fallback to an in-memory Map.
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

// In-memory cache: url → expiry timestamp (ms). 0 = permanent (saved items).
const inMemoryCache = new Map<string, number>();

function isExpired(expiry: number): boolean {
    // 0 means permanent (saved to DB)
    if (expiry === 0) return false;
    return Date.now() > expiry;
}

export const isDuplicate = async (url: string): Promise<boolean> => {
    if (redis && redis.status === 'ready') {
        try {
            const exists = await redis.get(`news:${url}`);
            return !!exists;
        } catch {
            // fall through to in-memory
        }
    }
    const expiry = inMemoryCache.get(url);
    if (expiry === undefined) return false;
    if (isExpired(expiry)) {
        inMemoryCache.delete(url);
        return false;
    }
    return true;
};

/**
 * Mark a URL as SAVED (permanent 7-day duplicate — never re-process).
 */
export const markAsSaved = async (url: string): Promise<void> => {
    if (redis && redis.status === 'ready') {
        try {
            await redis.set(`news:${url}`, 'saved', 'EX', 604800); // 7 days
            return;
        } catch {
            // fall through to in-memory
        }
    }
    inMemoryCache.set(url, 0); // 0 = permanent
};

/**
 * Mark a URL as REJECTED (short 1-hour cache — can be re-evaluated next run).
 */
export const markAsRejected = async (url: string): Promise<void> => {
    if (redis && redis.status === 'ready') {
        try {
            await redis.set(`news:${url}`, 'rejected', 'EX', 3600); // 1 hour
            return;
        } catch {
            // fall through to in-memory
        }
    }
    inMemoryCache.set(url, Date.now() + 60 * 60 * 1000); // 1 hour TTL
};

/**
 * Clear the entire in-memory cache (used for force-run).
 * If Redis is available, this does NOT clear Redis keys — only the in-process cache.
 */
export const clearCache = (): void => {
    inMemoryCache.clear();
    console.log('🧹 In-memory duplicate cache cleared.');
};
