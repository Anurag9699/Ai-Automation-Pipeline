import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { runPipeline, pipelineState } from './services/pipelineLogic';
import { clearCache } from './services/redisService';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// ─── Helper: Time Window to Date ───
function getDateFromWindow(window: string): Date {
    const now = new Date();
    switch (window) {
        case 'today': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'quarter': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
}

// ─── API: Fetch all generated content (with filters) ───
app.get('/api/content', async (req, res) => {
    try {
        const category = req.query.category as string | undefined;
        const search = req.query.search as string | undefined;
        const timeWindow = req.query.timeWindow as string | undefined;
        const signal = req.query.signal as string | undefined;

        const where: any = { title: { not: '' } };

        // Category filter
        if (category && category !== 'all') {
            where.category = { equals: category, mode: 'insensitive' };
        }

        // Time window filter
        if (timeWindow && timeWindow !== 'all') {
            where.createdAt = { gte: getDateFromWindow(timeWindow) };
        }

        // Signal badge filter
        if (signal && signal !== 'all') {
            where.signalBadge = { contains: signal, mode: 'insensitive' };
        }

        // Search filter
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { trivia: { contains: search, mode: 'insensitive' } },
                { caption: { contains: search, mode: 'insensitive' } },
                { headline: { contains: search, mode: 'insensitive' } },
                { hookSentence: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page as string || '1'));
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '50')));
        const skip = (page - 1) * limit;

        const contents = await prisma.newsContent.findMany({
            where,
            orderBy: { createdAt: 'desc' },  // Newest first
            skip: skip,
            take: limit
        });
        res.json(contents);
    } catch (error: any) {
        console.error('Failed to fetch content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// ─── API: Get stats for the dashboard ───
app.get('/api/stats', async (req, res) => {
    try {
        const total = await prisma.newsContent.count({ where: { title: { not: '' } } });
        const avgScore = await prisma.newsContent.aggregate({
            _avg: { score: true },
            where: { title: { not: '' } }
        });
        const categories = await prisma.newsContent.groupBy({
            by: ['category'],
            _count: { id: true },
            where: { title: { not: '' } }
        });
        const signals = await prisma.newsContent.groupBy({
            by: ['signalBadge'],
            _count: { id: true },
            where: { title: { not: '' }, signalBadge: { not: '' } }
        });
        res.json({
            totalPosts: total,
            avgScore: Math.round((avgScore._avg.score || 0) * 10) / 10,
            categories: categories.map(c => ({ name: c.category, count: c._count.id })),
            signals: signals.map(s => ({ name: s.signalBadge, count: s._count.id }))
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ─── API: Pipeline status (for live polling) ───
app.get('/api/pipeline-status', (req, res) => {
    res.json({
        status: pipelineState.status,
        logs: pipelineState.logs,
        savedCount: pipelineState.savedCount,
        processedCount: pipelineState.processedCount,
        totalCount: pipelineState.totalCount,
        startedAt: pipelineState.startedAt,
    });
});

// ─── API: Trigger the pipeline (non-blocking) ───
app.post('/api/trigger', async (req, res) => {
    if (pipelineState.status === 'running') {
        return res.json({ message: 'Pipeline already running', status: 'running' });
    }
    // ?force=true clears the in-memory duplicate cache before running
    if (req.query.force === 'true') {
        clearCache();
    }
    runPipeline().catch(err => console.error('Background pipeline error:', err));
    res.json({ message: 'Pipeline triggered!', status: 'running' });
});

// ─── API: Force-clear the duplicate cache ───
app.post('/api/clear-cache', (req, res) => {
    clearCache();
    res.json({ message: 'In-memory cache cleared. Next run will re-evaluate all RSS items.' });
});

// ─── Cron Job ───
cron.schedule('0 */3 * * *', async () => {
    console.log('Cron triggered: Running IWTK Pipeline...');
    try { await runPipeline(); } catch (error) { console.error('Cron job failed:', error); }
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`IWTK Server running on port ${PORT}`);
    console.log(`Cron job scheduled (every 3 hours).`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        process.exit(0);
    });
});
