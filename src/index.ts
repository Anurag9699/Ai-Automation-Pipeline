import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { runPipeline, pipelineState } from './services/pipelineLogic';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// ─── API: Fetch all generated content (with optional category filter + search) ───
app.get('/api/content', async (req, res) => {
    try {
        const category = req.query.category as string | undefined;
        const search = req.query.search as string | undefined;
        const where: any = { title: { not: '' } };
        if (category && category !== 'all') {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { trivia: { contains: search, mode: 'insensitive' } },
                { caption: { contains: search, mode: 'insensitive' } },
            ];
        }
        const contents = await prisma.newsContent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
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
        res.json({
            totalPosts: total,
            avgScore: Math.round((avgScore._avg.score || 0) * 10) / 10,
            categories: categories.map(c => ({ name: c.category, count: c._count.id }))
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

// ─── API: Get random quiz questions ───
app.get('/api/quiz', async (req, res) => {
    try {
        const allWithMcq = await prisma.newsContent.findMany({
            where: { title: { not: '' } },
            select: { id: true, title: true, mcq: true, category: true }
        });
        const validQuestions = allWithMcq.filter((item: any) => {
            const mcq = item.mcq as any;
            return mcq && mcq.question && Array.isArray(mcq.options) && mcq.options.length >= 2 && mcq.correctAnswer;
        });
        const shuffled = validQuestions.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(5, shuffled.length));
        const questions = selected.map((item: any) => ({
            id: item.id,
            newsTitle: item.title,
            category: item.category,
            question: (item.mcq as any).question,
            options: (item.mcq as any).options,
            correctAnswer: (item.mcq as any).correctAnswer
        }));
        res.json({ totalAvailable: validQuestions.length, questions });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

// ─── API: Trigger the pipeline (non-blocking) ───
app.post('/api/trigger', async (req, res) => {
    if (pipelineState.status === 'running') {
        return res.json({ message: 'Pipeline already running', status: 'running' });
    }
    runPipeline().catch(err => console.error('Background pipeline error:', err));
    res.json({ message: 'Pipeline triggered!', status: 'running' });
});

// ─── Cron Job ───
cron.schedule('0 */3 * * *', async () => {
    console.log('Cron triggered: Running AI Automation Pipeline...');
    try { await runPipeline(); } catch (error) { console.error('Cron job failed:', error); }
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Cron job scheduled (every 3 hours).`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});
