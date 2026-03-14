import { PrismaClient } from '@prisma/client';
import { fetchNewsFromFeeds } from './src/services/rssService';

const prisma = new PrismaClient();

const DUMMY_TRIVIA = [
  "1️⃣ **Lightning Speed!** ⚡ An accidental 'like' on Instagram can be seen by thousands of followers within seconds before it's noticed and undone, often captured in screenshots!",
  "2️⃣ **Mimi's Impact!** 🤰 Kriti Sanon's Best Actress win for Mimi at the Zee Cine Awards 2023 celebrated her transformative portrayal of a surrogate mother.",
  "3️⃣ **The Social Shield!** 🕵️‍♀️ Did you know many A-list celebrities employ dedicated social media teams who monitor their accounts 24/7?"
];

async function seed() {
    console.log('Fetching RSS feeds...');
    const news = await fetchNewsFromFeeds();
    
    console.log(`Fetched ${news.length} items. Seeding first 15...`);
    let count = 0;
    
    for (const item of news) {
        if (!item.imageUrl) continue; // Only seed ones with images!
        if (count >= 15) break;

        try {
            await prisma.newsContent.create({
                data: {
                    title: item.title,
                    description: item.description,
                    link: item.link,
                    pubDate: item.pubDate,
                    sourceUrl: item.link,
                    
                    category: ['entertainment', 'sports', 'science', 'technology', 'history'][Math.floor(Math.random() * 5)],
                    score: Math.floor(Math.random() * 3) + 7,
                    
                    headline: item.title,
                    hookSentence: item.description.substring(0, 150) + '...',
                    caption: item.title,
                    hashtags: ["#news", "#update"],
                    trivia: DUMMY_TRIVIA[Math.floor(Math.random() * DUMMY_TRIVIA.length)],
                    mcq: { question: "What happened?", options: ["A", "B", "C", "D"], correctAnswer: "A" },
                    
                    signalScores: { surprise: 2, novelty: 3, emotion: 1, shareability: 2, indiaConnection: 0, explainer: 1, parallelStory: 0 },
                    signalBadge: ['🎲 Surprise', '🥇 Novelty', '❤️ Emotion'][Math.floor(Math.random() * 3)],
                    
                    imageUrl: item.imageUrl
                }
            });
            count++;
            console.log(`Saved: ${item.title.substring(0, 30)} - Image: ${item.imageUrl.substring(0,30)}`);
        } catch (e) {
            // ignore unique constraints
        }
    }
    console.log(`Done! Seeded ${count} items with REAL images.`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
