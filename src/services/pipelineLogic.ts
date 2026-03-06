import { PrismaClient } from '@prisma/client';
import { fetchNewsFromFeeds } from './rssService';
import { evaluateNews, generateContent } from './aiService';
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
    // Keep only last 50 logs
    if (pipelineState.logs.length > 50) pipelineState.logs.shift();
}

export const runPipeline = async () => {
    // Prevent multiple simultaneous runs
    if (pipelineState.status === 'running') {
        log('⚠️ Pipeline already running, skipping...');
        return;
    }

    pipelineState.status = 'running';
    pipelineState.logs = [];
    pipelineState.startedAt = new Date();
    pipelineState.savedCount = 0;
    pipelineState.processedCount = 0;

    log('🚀 Starting AI Automation Pipeline...');

    try {
        // 1. Fetch News (limit to 5 for demo)
        const rawNews = (await fetchNewsFromFeeds()).slice(0, 10);
        pipelineState.totalCount = rawNews.length;
        log(`📡 Fetched ${rawNews.length} news items from RSS feeds`);

        for (const news of rawNews) {
            try {
                pipelineState.processedCount++;

                // Delay to respect Gemini Free Tier rate limit
                log(`⏳ Rate limit cooldown before item ${pipelineState.processedCount}/${rawNews.length}...`);
                await new Promise(r => setTimeout(r, 13000));

                // 2. Duplicate Detection
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

                // 3. AI Rating & Filtering
                log(`🤖 Evaluating: "${news.title.substring(0, 60)}..."`);
                const evaluation = await evaluateNews(news);

                if (!evaluation) {
                    log(`❌ Evaluation failed for: ${news.title.substring(0, 50)}...`);
                    continue;
                }

                if (evaluation.score <= 5) {
                    log(`🚫 Rejected (Score ${evaluation.score}/10): ${evaluation.reason?.substring(0, 60) || 'Low engagement'}`);
                    await markAsProcessed(news.link);
                    continue;
                }

                log(`✅ Accepted (Score ${evaluation.score}/10)! Generating content...`);

                // 4. Generate Content
                await new Promise(r => setTimeout(r, 13000));
                const generated = await generateContent(news);

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

                const hasValidMcq = generated.mcq && generated.mcq.question && Array.isArray(generated.mcq.options) && generated.mcq.options.length >= 2;

                // 5. Store in Database
                const savedContent = await prisma.newsContent.create({
                    data: {
                        title: news.title,
                        headline: generated.headline || '',
                        category: evaluation.category || 'trending',
                        caption: generated.caption + '\n\n' + (generated.hashtags || []).map(h => `#${h.replace('#', '')}`).join(' '),
                        trivia: generated.trivia,
                        mcq: hasValidMcq ? generated.mcq : {},
                        score: evaluation.score,
                        sourceUrl: news.link
                    }
                });

                pipelineState.savedCount++;
                log(`💾 Saved! "${news.title.substring(0, 50)}..." (ID: ${savedContent.id.substring(0, 8)}...)`);

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
