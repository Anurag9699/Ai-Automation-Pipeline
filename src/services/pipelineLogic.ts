import { PrismaClient } from '@prisma/client';
import { fetchNewsFromFeeds, getContextualImage } from './rssService';
import { evaluateNews, generateContent, passesThreshold, getPrimarySignal, computeOverallScore } from './aiService';
import { isDuplicate, markAsProcessed } from './redisService';

const prisma = new PrismaClient();

// ─── Pipeline State (exported for real-time status polling) ───
export const pipelineState = {
    status: 'idle' as 'idle' | 'running' | 'done' | 'error',
    logs: [] as string[],
    startedAt: null as Date | null,
    savedCount: 0,
    processedCount: 0,
    totalCount: 0,
};

function log(msg: string) {
    console.log(msg);
    pipelineState.logs.push(msg);
    if (pipelineState.logs.length > 50) pipelineState.logs.shift();
}

export const runPipeline = async () => {
    if (pipelineState.status === 'running') {
        log('⚠️ Pipeline already running, skipping...');
        return;
    }

    pipelineState.status = 'running';
    pipelineState.logs = [];
    pipelineState.startedAt = new Date();
    pipelineState.savedCount = 0;
    pipelineState.processedCount = 0;

    log('🚀 Starting IWTK Pipeline (7-Signal Scoring)...');

    try {
        const rawNews = (await fetchNewsFromFeeds()).slice(0, 10);
        pipelineState.totalCount = rawNews.length;
        log(`📡 Fetched ${rawNews.length} news items from RSS feeds`);

        for (const news of rawNews) {
            try {
                pipelineState.processedCount++;

                // Rate limit cooldown for Gemini free tier
                log(`⏳ Rate limit cooldown before item ${pipelineState.processedCount}/${rawNews.length}...`);
                await new Promise(r => setTimeout(r, 13000));

                // ── Duplicate Detection ──
                if (await isDuplicate(news.link)) {
                    log(`⏭️ Skipping duplicate: ${news.title.substring(0, 50)}...`);
                    continue;
                }

                const existingInDb = await prisma.newsContent.findUnique({
                    where: { sourceUrl: news.link }
                });

                if (existingInDb) {
                    log(`⏭️ Already in DB: ${news.title.substring(0, 50)}...`);
                    await markAsProcessed(news.link);
                    continue;
                }

                // ── AI Evaluation (7-Signal Scoring) ──
                log(`🤖 Evaluating: "${news.title.substring(0, 60)}..."`);
                const evaluation = await evaluateNews(news);

                if (!evaluation || !evaluation.signalScores) {
                    log(`❌ Evaluation failed for: ${news.title.substring(0, 50)}...`);
                    continue;
                }

                // ── Threshold Check (Mentor Spec) ──
                if (!passesThreshold(evaluation.signalScores)) {
                    const scores = evaluation.signalScores;
                    const topScore = Math.max(...Object.values(scores));
                    log(`🚫 Rejected (top signal: ${topScore}/3): ${evaluation.reason?.substring(0, 60) || 'Low interestingness'}`);
                    await markAsProcessed(news.link);
                    continue;
                }

                const overallScore = computeOverallScore(evaluation.signalScores);
                const primarySignal = getPrimarySignal(evaluation.signalScores);
                log(`✅ Accepted! ${primarySignal} (Score ${overallScore}/10). Generating content...`);

                // ── Content Generation (with category-specific prompts) ──
                await new Promise(r => setTimeout(r, 13000));
                const generated = await generateContent(news, evaluation.category);

                if (!generated) {
                    log(`❌ Content generation failed`);
                    continue;
                }

                // Validation
                if (!generated.caption || !generated.trivia || !news.title) {
                    log(`⚠️ Incomplete AI response, skipping save`);
                    await markAsProcessed(news.link);
                    continue;
                }

                // ── Save to Database ──
                const savedContent = await prisma.newsContent.create({
                    data: {
                        title: news.title,
                        headline: generated.headline || '',
                        hookSentence: generated.hookSentence || '',
                        category: evaluation.category || 'trending',
                        caption: generated.caption + '\n\n' + (generated.hashtags || []).map(h => `#${h.replace('#', '')}`).join(' '),
                        trivia: Array.isArray(generated.trivia) ? JSON.stringify(generated.trivia) : JSON.stringify([generated.trivia]),
                        score: overallScore,
                        signalScores: evaluation.signalScores as any,
                        signalBadge: generated.signalBadge || primarySignal,
                        imageUrl: news.imageUrl || getContextualImage(news.title),
                        sourceUrl: news.link
                    }
                });

                pipelineState.savedCount++;
                log(`💾 Saved! ${primarySignal} "${news.title.substring(0, 50)}..." (ID: ${savedContent.id.substring(0, 8)}...)`);

                await markAsProcessed(news.link);

            } catch (error: any) {
                log(`❌ Error: ${error.message?.substring(0, 80) || 'Unknown error'}`);
            }
        }

        log(`🎉 Pipeline complete! Saved ${pipelineState.savedCount} new items.`);
        pipelineState.status = 'done';

    } catch (error: any) {
        log(`💥 Pipeline crashed: ${error.message?.substring(0, 80) || 'Unknown'}`);
        pipelineState.status = 'error';
    }
};
