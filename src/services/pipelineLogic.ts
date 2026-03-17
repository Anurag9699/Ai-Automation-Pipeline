import { PrismaClient } from '@prisma/client';
import { fetchNewsFromFeeds, getContextualImage } from './rssService';
import { evaluateNews, generateContent, passesThreshold, getPrimarySignal, computeOverallScore } from './aiService';
import { isDuplicate, markAsSaved, markAsRejected } from './redisService';

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
        // Fetch all items from RSS feeds (usually around 50)
        const allFetchedNews = await fetchNewsFromFeeds();
        log(`📡 Fetched ${allFetchedNews.length} news items from RSS feeds`);

        const rawNews = [];
        // Filter sequentially to check DB and Cache, grab up to 10 fresh items to avoid AI rate limits
        for (const news of allFetchedNews) {
            if (rawNews.length >= 10) break; 

            // ── Duplicate Cache Detection ──
            if (await isDuplicate(news.link)) {
                log(`⏭️ Skipping duplicate: ${news.title.substring(0, 50)}...`);
                continue;
            }

            // ── Database Duplicate Detection ──
            const existingInDb = await prisma.newsContent.findUnique({
                where: { sourceUrl: news.link }
            });

            if (existingInDb) {
                log(`⏭️ Already in DB: ${news.title.substring(0, 50)}...`);
                await markAsSaved(news.link); // Ensure permanent duplicate flag is set
                continue;
            }

            // It's a fresh, unprocessed item. Add it to our processing queue.
            rawNews.push(news);
        }

        pipelineState.totalCount = rawNews.length;
        
        if (rawNews.length === 0) {
            log('🎉 All fetched items are either duplicates or already in DB. Nothing new to process.');
            pipelineState.status = 'idle';
            return;
        } else {
            log(`🤖 Proceeding to evaluate ${rawNews.length} fresh items with AI...`);
        }

        for (const news of rawNews) {
            try {
                pipelineState.processedCount++;

                // Rate limit cooldown for Gemini free tier
                log(`⏳ Cooldown before item ${pipelineState.processedCount}/${rawNews.length}... (5s)`);
                await new Promise(r => setTimeout(r, 5000));

                // ── AI Evaluation (7-Signal Scoring) ──
                log(`🤖 Evaluating: "${news.title.substring(0, 60)}..."`);
                let evaluation;
                try {
                    evaluation = await evaluateNews(news);
                } catch (e: any) {
                    log(`❌ Evaluation failed for: ${news.title.substring(0, 50)}... (${e.message})`);
                    console.error(e);
                    await markAsRejected(news.link); // Short-cache so we can retry later
                    continue;
                }

                if (!evaluation || !evaluation.signalScores) {
                    log(`❌ Evaluation returned no valid signals for: ${news.title.substring(0, 50)}...`);
                    log(`Full evaluation debug: ${JSON.stringify(evaluation)}`);
                    await markAsRejected(news.link);
                    continue;
                }

                // Log the scores for transparency
                const scores = evaluation.signalScores;
                const scoreStrings = Object.entries(scores)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(', ');
                log(`📊 Scores: { ${scoreStrings} }`);

                // ── Threshold Check (Mentor Spec) ──
                if (!passesThreshold(evaluation.signalScores)) {
                    const scores = evaluation.signalScores;
                    const topScore = Math.max(...Object.values(scores));
                    log(`🚫 Rejected (top signal: ${topScore}/3): ${evaluation.reason?.substring(0, 60) || 'Low interestingness'}`);
                    await markAsRejected(news.link); // Short-cache, re-evaluate next run
                    continue;
                }

                const overallScore = computeOverallScore(evaluation.signalScores);
                const primarySignal = getPrimarySignal(evaluation.signalScores);
                log(`✅ Accepted! ${primarySignal} (Score ${overallScore}/10). Generating content...`);

                // ── Content Generation (with category-specific prompts) ──
                await new Promise(r => setTimeout(r, 4000));
                const generated = await generateContent(news, evaluation.category);

                if (!generated) {
                    log(`❌ Content generation failed`);
                    await markAsRejected(news.link);
                    continue;
                }

                // Validation
                if (!generated.caption || !generated.trivia || !news.title) {
                    log(`⚠️ Incomplete AI response, skipping save`);
                    await markAsRejected(news.link);
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

                await markAsSaved(news.link); // Permanently cached — don't re-save

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
