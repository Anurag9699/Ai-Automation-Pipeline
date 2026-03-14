/**
 * seed_news.js — Seeds the database with fresh RSS items + unique per-article images
 * 
 * Image waterfall per article:
 *   1. RSS feed image (media:content, enclosure, <img> in content)
 *   2. OG image scraped from the article's source page
 *   3. Unique Unsplash fallback using article-specific keywords
 */
const { PrismaClient } = require('@prisma/client');
const Parser = require('rss-parser');

const prisma = new PrismaClient();
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
        ]
    }
});

function cleanRSSContent(text) {
    if (!text) return '';
    return text
        .replace(/Get our breaking news email, free app or daily news podcast/gi, '')
        .replace(/Follow us on (Twitter|Facebook|Instagram|LinkedIn)/gi, '')
        .replace(/Read more\.\.\./gi, '')
        .replace(/Continue reading\.\.\./gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ─── Extract image URL from RSS item fields ─────────────────────
function extractImageFromRSS(item) {
    let url = undefined;

    // 1. media:content (Pick largest)
    if (item.mediaContent) {
        const contents = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
        let maxW = 0;
        let best = undefined;
        for (const c of contents) {
            const attr = c.$ || {};
            const w = parseInt(attr.width || 0);
            if (attr.url && w >= maxW) {
                maxW = w;
                best = attr.url;
            }
        }
        if (best) url = best;
    }

    // 2. media:thumbnail (Pick largest if no content)
    if (!url && item.mediaThumbnail) {
        const thumbs = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail : [item.mediaThumbnail];
        let maxW = 0;
        let best = undefined;
        for (const t of thumbs) {
            const attr = t.$ || {};
            const w = parseInt(attr.width || 0);
            if (attr.url && w >= maxW) {
                maxW = w;
                best = attr.url;
            }
        }
        if (best) url = best;
    }

    // 3. enclosure (image type)
    if (!url && item.enclosure && item.enclosure.url) {
        if (!item.enclosure.type || item.enclosure.type.startsWith('image/')) {
            url = item.enclosure.url;
        }
    }

    // 4. Fallback: Parse <img> tag from content or description
    if (!url) {
        const contentToSearch = item['content:encoded'] || item.content || item.description || '';
        const imgMatch = contentToSearch.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) url = imgMatch[1];
    }

    return url;
}

// ─── Scrape og:image from article source page ───────────────────
async function scrapeOgImage(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; IWTKBot/1.0)',
                'Accept': 'text/html',
            },
            redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!res.ok) return null;

        // Read only the first 50KB to find the og:image tag (it's always in <head>)
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let html = '';
        let bytesRead = 0;
        const MAX_BYTES = 50 * 1024;

        while (bytesRead < MAX_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            html += decoder.decode(value, { stream: true });
            bytesRead += value.length;
            // Stop early if we've passed </head>
            if (html.includes('</head>')) break;
        }
        reader.cancel();

        // Match og:image meta tag
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
            const imgUrl = ogMatch[1];
            // Basic validation — must look like an image URL
            if (imgUrl.startsWith('http') && /\.(jpg|jpeg|png|webp|gif)/i.test(imgUrl)) {
                return imgUrl;
            }
            // Some og:image URLs don't have extensions but are still valid
            if (imgUrl.startsWith('http')) {
                return imgUrl;
            }
        }

        // Also try twitter:image
        const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
        if (twMatch && twMatch[1] && twMatch[1].startsWith('http')) {
            return twMatch[1];
        }

        return null;
    } catch (e) {
        // Timeout, network error, etc. — just skip
        return null;
    }
}

// ─── Unique Unsplash fallback using article keywords ────────────
const STOP_WORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','was','are','were','be','been','has','have','had','it',
    'its','his','her','their','this','that','just','not','as','up','out',
    'after','if','over','into','than','then','when','there','who','what',
    'how','about','new','says','amid','shows','report','reports','could',
    'would','should','will','can','may','might','do','does','did','been',
    'being','no','yes','so','also','more','most','very','much','many',
]);

function getUniqueUnsplashUrl(title) {
    // Extract meaningful keywords from the title
    const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    // Take the top 3 most meaningful keywords
    const keywords = words.slice(0, 3).join(',');
    const fallbackKeywords = keywords || 'news,world';

    // Use Unsplash Source API — Higher resolution for sharp modal view
    return `https://source.unsplash.com/1600x900/?${encodeURIComponent(fallbackKeywords)}`;
}

// ─── Category Detector ───────────────────────────────────────────
function detectCategory(title) {
    const t = title.toLowerCase();
    if (/cricket|sport|football|olympic|athlete/.test(t)) return 'sports';
    if (/film|movie|bollywood|hollywood|actor|netflix/.test(t)) return 'entertainment';
    if (/science|research|experiment|lab|physics|cell|treatment/.test(t)) return 'science';
    if (/tech|digital|computer|software|ai|robot|hack|cyber|data|algorithm/.test(t)) return 'technology';
    if (/health|hospital|doctor|virus|cancer|drug|medicine|nhs|fetus/.test(t)) return 'health';
    if (/history|ancient|heritage|museum|massacre/.test(t)) return 'history';
    if (/animal|wildlife|ocean|climate|environment|species/.test(t)) return 'animals';
    if (/geography|country|nation|continent|ocean/.test(t)) return 'geography';
    if (/music|concert|band|singer|grammy/.test(t)) return 'music';
    return 'trending';
}

const TRIVIA_FACTS = [
    [
        "Cleopatra actually lived closer in time to the Moon landing (1969) than to the building of the Great Pyramid of Giza.",
        "The Great Pyramid was already 2,500 years old by the time Cleopatra was born.",
        "Cleopatra was the first member of her Greek-speaking dynasty to actually learn the Egyptian language.",
        "Despite her name, Cleopatra VII was actually of Macedonian Greek descent, not ethnic Egyptian.",
        "The library of Alexandria, which she helped protect, once held over 400,000 scrolls before its destruction."
    ],
    [
        "The word 'Bluetooth' is actually named after a 10th-century Viking King, Harald Bluetooth, who united Scandinavia.",
        "The Bluetooth logo is a combination of the Nordic runes for his initials (H and B).",
        "Harald got his nickname 'Bluetooth' because he supposedly had a dead tooth that looked dark blue or black.",
        "The technology was intended to 'unite' communication protocols just as Harald united the tribes.",
        "Intel, Ericsson, and Nokia chose the name as a placeholder before it became the global standard."
    ],
    [
        "Nintendo was founded in 1889—not as a video game company, but as a producer of handmade playing cards called Hanafuda.",
        "The company actually tried running a taxi service and a 'love hotel' chain before finding success in toys and games.",
        "The name 'Nintendo' can be translated from Japanese as 'Leave luck to heaven.'",
        "Super Mario was originally named 'Jumpman' and was only renamed after the landlord of the company's US warehouse.",
        "The Game Boy was so durable that one unit survived a barracks bombing in the Gulf War and still works in the Nintendo World Store today."
    ]
];

const HOOKS = [
    "This story has a twist that most people would never expect — and it changes everything.",
    "What seems like ordinary news hides a fascinating detail that will make you think twice.",
    "You've probably heard about this story, but the most interesting part hasn't been told yet.",
];

async function seed() {
    const feeds = [
        'https://www.theguardian.com/world/rss',
        'https://www.wired.com/feed/rss',
        'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
        'https://allthatsinteresting.com/feed',
    ];

    const allItems = [];
    for (const feedUrl of feeds) {
        try {
            const feed = await parser.parseURL(feedUrl);
            allItems.push(...feed.items.filter(i => i.title && i.link));
        } catch(e) {
            console.log('Feed error:', feedUrl, e.message);
        }
    }

    console.log(`Fetched ${allItems.length} total items`);

    // Track used image URLs to prevent duplicates within this seeding run
    const usedImages = new Set();
    let count = 0;

    for (const item of allItems) {
        if (count >= 18) break;

        const title = item.title;
        const description = cleanRSSContent(item.contentSnippet || item.content || '');

        // ── IMAGE WATERFALL ──
        let imageUrl = null;

        // Step 1: Try RSS feed image
        imageUrl = extractImageFromRSS(item);
        if (imageUrl) {
            console.log(`  📷 [RSS]    ${title.substring(0, 40)}...`);
        }

        // Step 2: Try OG image from source page
        if (!imageUrl) {
            imageUrl = await scrapeOgImage(item.link);
            if (imageUrl) {
                console.log(`  📷 [OG]     ${title.substring(0, 40)}...`);
            }
        }

        // Step 3: Unique Unsplash fallback
        if (!imageUrl) {
            imageUrl = getUniqueUnsplashUrl(title);
            console.log(`  📷 [UNSP]   ${title.substring(0, 40)}...`);
        }

        // If this exact image URL has already been used, generate a unique Unsplash one instead
        if (usedImages.has(imageUrl)) {
            imageUrl = getUniqueUnsplashUrl(title + ' ' + count);
            console.log(`  📷 [DEDUP]  ${title.substring(0, 40)}...`);
        }
        usedImages.add(imageUrl);

        try {
            await prisma.newsContent.create({
                data: {
                    title,
                    headline: title,
                    hookSentence: description.substring(0, 200) || HOOKS[count % HOOKS.length],
                    category: detectCategory(title),
                    caption: description.substring(0, 300) || title,
                    trivia: JSON.stringify([
                        `Surprising detail: ${title.split(' ').slice(0, 5).join(' ')}... is more significant than it appears.`,
                        `If you look closely at this event, it breaks several historical precedents perfectly.`,
                        `The immediate aftermath of this development was completely unexpected by major analysts.`,
                        `Most readers miss the crucial detail hidden within the timeline of these events.`,
                        `This could eventually shape future policies related to the core topic discussed here.`
                    ]),
                    score: 7 + (count % 3),
                    signalScores: { surprise: 2, novelty: 2, emotion: 1, shareability: 2, indiaConnection: 0, explainer: 1, parallelStory: 1 },
                    signalBadge: ['🎲 Surprise', '🥇 Novelty', '❤️ Emotion', '📣 Shareability', '📖 Explainer'][count % 5],
                    imageUrl: imageUrl,
                    sourceUrl: item.link,
                }
            });
            count++;
            console.log(`✅ [${count}] ${title.substring(0, 60)}`);
        } catch(e) {
            if (!e.message.includes('Unique constraint')) {
                console.error(`❌ Error saving "${title.substring(0, 40)}":`, e.message);
            }
        }
    }

    console.log(`\n🎉 Seeded ${count} items with unique per-article images!`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
