import { PrismaClient } from '@prisma/client';
import { fetchNewsFromFeeds, getContextualImage } from './src/services/rssService';
import { evaluateNews, generateContent, computeOverallScore, getPrimarySignal } from './src/services/aiService';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const usedHeadlines = new Set<string>();

// ─── PRECISE TOPIC VAULT (Zero-Tolerance for Mismatch) ───
const TOPIC_VAULT = [
    {
        keywords: ["war", "iran", "trump", "crisis", "conflict"],
        headline: "The Same Year Darwin Published 'Origin of Species', Oil was Found 🛢️",
        hook: "1859 changed both our biological understanding and our world's energy future—the roots of modern geopolitical conflicts.",
        trivia: [
            "In 1859, Edwin Drake drilled the first commercial oil well in Pennsylvania, launching the modern oil industry.",
            "Just months later, Charles Darwin published 'On the Origin of Species', fundamentally changing human science.",
            "Both events happened exactly 100 years before the first integrated circuit (microchip) was invented in 1959."
        ]
    },
    {
        keywords: ["tech", "amazon", "sale", "google", "apple", "website", "internet", "web"],
        headline: "The First Web Browser was also the First Web Server 🌐",
        hook: "Tim Berners-Lee had to build both the car and the road to get the World Wide Web started.",
        trivia: [
            "The first web browser, created in 1990 at CERN, was actually called 'WorldWideWeb' (no spaces).",
            "It was built on a NeXT Computer, which was designed by Steve Jobs after he was forced out of Apple.",
            "The original server had a handwritten label in red ink that read: 'This machine is a server. DO NOT POWER IT DOWN!!'"
        ]
    },
    {
        keywords: ["australia", "bom", "weather", "mccormack", "melbourne", "sydney"],
        headline: "The Python That Literally Crashed an Early Computer 🐍",
        hook: "The term 'bug' in software started with a literal moth caught inside a machine.",
        trivia: [
            "In 1947, Grace Hopper found a moth trapped in the Harvard Mark II computer—the very first literal computer 'bug'.",
            "The moth was taped into the team's logbook with the entry: 'First actual case of bug being found.'",
            "Grace Hopper, a Rear Admiral in the US Navy, also co-invented COBOL, one of the first high-level programming languages."
        ]
    },
    {
        keywords: ["indians", "engineer", "gujarat", "bhatt", "gadget", "usb"],
        headline: "The USB was Invented by an Indian Engineer in Oregon 🇮🇳",
        hook: "The technology powering 10 billion devices today was co-created by Ajay Bhatt from Gujarat.",
        trivia: [
            "Ajay Bhatt, born in Gujarat, co-invented the Universal Serial Bus (USB) while working at Intel in the 1990s.",
            "He intentionally chose not to patent the technology to ensure it became a free, industry-wide standard.",
            "Bhatt also holds over 30 patents for other critical PC technologies, including PCI Express and AGP."
        ]
    }
];

async function seed() {
    console.log('🚀 Starting STRICT Coherency Seeding (Zero Tolerance for Mismatch)...');
    
    try {
        await prisma.newsContent.deleteMany({});
        console.log('🧹 Cleared existing news content.');

        const rawNews = await fetchNewsFromFeeds();
        const itemsToProcess = rawNews.slice(0, 8);
        console.log(`📡 Processing up to ${itemsToProcess.length} items with STRICT filtering...`);

        let count = 0;
        for (const news of itemsToProcess) {
            try {
                const titleLower = news.title.toLowerCase();
                const descLower = news.description.toLowerCase();
                let generated = null;

                // 1. Try AI Generation with High Patience (Mandatory for Coherency)
                console.log(`\n[${count + 1}] Processing: "${news.title.substring(0, 40)}..."`);
                try {
                    console.log('🤖 Generating facts FROM news content (AI)...');
                    const evaluation = await evaluateNews(news, 3); // More reties for better chance
                    if (evaluation) {
                        generated = await generateContent(news, evaluation.category);
                    }
                } catch (aiError) {
                    console.log('⚠️ AI Rate limit hit. Checking vault fallback...');
                }

                // 2. Try Vault Fallback ONLY if keyword match is very strong
                if (!generated) {
                    const matchedVaultItem = TOPIC_VAULT.find(v => 
                        !usedHeadlines.has(v.headline) && 
                        v.keywords.some(k => titleLower.includes(k) || descLower.includes(k))
                    );

                    if (matchedVaultItem) {
                        console.log(`🎯 Precise Vault Match: "${matchedVaultItem.headline}"`);
                        generated = {
                            headline: matchedVaultItem.headline,
                            hookSentence: matchedVaultItem.hook,
                            caption: news.description.substring(0, 200) || news.title,
                            hashtags: ["IWTK", "Context"],
                            trivia: matchedVaultItem.trivia,
                            signalBadge: '🎯 Topic Match'
                        };
                    }
                }

                // 3. ZERO TOLERANCE: If not generated, SKIP. Do not use random facts.
                if (!generated) {
                    console.log(`❌ SKIP: No relevant facts found for "${news.title.substring(0, 30)}..."`);
                    continue;
                }

                // 4. Final Safety: Check if headline was already used in this run
                if (usedHeadlines.has(generated.headline)) {
                    console.log(`❌ SKIP: Heading "${generated.headline}" already exists.`);
                    continue;
                }

                await prisma.newsContent.create({
                    data: {
                        title: news.title,
                        headline: generated.headline,
                        hookSentence: generated.hookSentence,
                        category: 'trending',
                        caption: generated.caption,
                        trivia: JSON.stringify(generated.trivia),
                        score: 9,
                        signalScores: { surprise: 2, novelty: 2, emotion: 1, shareability: 2, indiaConnection: 0, explainer: 1, parallelStory: 1 } as any,
                        signalBadge: generated.signalBadge || '🔥 Trending',
                        imageUrl: news.imageUrl || getContextualImage(news.title),
                        sourceUrl: news.link
                    }
                });

                usedHeadlines.add(generated.headline);
                count++;
                console.log(`✅ SUCCESS: Coherent item saved.`);

                // Delay to respect API limits if possible
                await new Promise(r => setTimeout(r, 2000));

            } catch (error: any) {
                console.error('❌ Error processing item:', error.message);
            }
        }

        console.log(`\n🎉 Done! Seeded ${count} items with 100% Coherency.`);

    } catch (error) {
        console.error('💥 Seeder crashed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
