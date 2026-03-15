const { PrismaClient } = require('@prisma/client');
// Manually setting to production URL
process.env.DATABASE_URL = "postgresql://ai_pipeline_db_user:K4IfhZLLpC3m43y3dInr9G19WJ0p1xZl@dpg-d6gu017kijhs73f5vtdg-a.oregon-postgres.render.com/ai_pipeline_db";
const prisma = new PrismaClient();

const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','was','are','were','be','been','has','have','had','it','its','his','her','their','this','that','just','not','as','up','out','after','if','over','into','than','then','when','there','who','what','how','about','new','says','amid','shows','report','reports','could','would','should','will','can','may','might','do','does','did','been','being','no','yes','so','also','more','most','very','much','many']);

function getContextualImage(title) {
    const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    const keywords = (words.slice(0, 2).join(',') || 'news,world').replace(/,/g, ' ');
    return `https://loremflickr.com/1600/900/${encodeURIComponent(keywords)}`;
}

async function fixImages() {
    console.log('Connecting to PRODUCTION database...');
    const articles = await prisma.newsContent.findMany({
        where: { imageUrl: { equals: "" } }
    });

    console.log(`Found ${articles.length} articles missing images on PROD.`);
    
    for (const article of articles) {
        const newUrl = getContextualImage(article.title);
        await prisma.newsContent.update({
            where: { id: article.id },
            data: { imageUrl: newUrl }
        });
        console.log(`✅ Fixed: ${article.title.substring(0, 40)} -> ${newUrl}`);
    }
    
    console.log('Production missing images have been backfilled!');
}

fixImages().catch(console.error).finally(() => prisma.$disconnect());
