import Parser from 'rss-parser';

// ─── Helper: Clean RSS Boilerplate ───
function cleanRSSContent(text: string): string {
    if (!text) return '';
    return text
        .replace(/Get our breaking news email, free app or daily news podcast/gi, '')
        .replace(/Follow us on (Twitter|Facebook|Instagram|LinkedIn)/gi, '')
        .replace(/Read more\.\.\./gi, '')
        .replace(/Continue reading\.\.\./gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

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

export interface ParsedNewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    imageUrl?: string;
}


function extractImage(item: any): string | undefined {
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

    // 3. enclosure (Fallback if still no url)
    if (!url && item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
        url = item.enclosure.url;
    }
    
    // 4. Final Fallback: Parse <img> tag from content or description
    if (!url) {
        const contentToSearch = item.content || item.contentSnippet || item.description || '';
        const imgMatch = contentToSearch.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) url = imgMatch[1];
    }
    
    return url;
}

// ─── Scrape og:image from article source page ──────────────────────
async function scrapeOgImage(url: string): Promise<string | undefined> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html',
            }
        } as any);

        clearTimeout(timeoutId);

        if (!res.ok) return undefined;

        // Get the first 100KB of the page - usually enough for <head>
        const text = await res.text();
        const head = text.substring(0, 100000);

        const ogMatch = head.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        
        if (ogMatch?.[1]?.startsWith('http')) return ogMatch[1];

        const twMatch = head.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
            || head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
        
        if (twMatch?.[1]?.startsWith('http')) return twMatch[1];

        return undefined;
    } catch (e) {
        return undefined;
    }
}

// ─── Unique Unsplash fallback using article-specific keywords ───────
const STOP_WORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','was','are','were','be','been','has','have','had','it',
    'its','his','her','their','this','that','just','not','as','up','out',
    'after','if','over','into','than','then','when','there','who','what',
    'how','about','new','says','amid','shows','report','reports','could',
    'would','should','will','can','may','might','do','does','did','been',
    'being','no','yes','so','also','more','most','very','much','many',
]);

export function getContextualImage(title: string): string {
    const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOP_WORDS.has(w));

    const keywords = (words.slice(0, 2).join(',') || 'news,world').replace(/,/g, ' ');

    // Switched to LoremFlickr as source.unsplash.com is deprecated
    return `https://loremflickr.com/1600/900/${encodeURIComponent(keywords)}`;
}


const RSS_FEEDS = [
    // ─── Reddit Gold-Standard Sources (Mentor: "r/todayilearned is gold-standard") ───
    'https://www.reddit.com/r/todayilearned/top/.rss?t=day',
    'https://www.reddit.com/r/interestingasfuck/top/.rss?t=day',
    'https://www.reddit.com/r/science/top/.rss?t=day',
    'https://www.reddit.com/r/worldnews/top/.rss?t=day',
    'https://www.reddit.com/r/movies/top/.rss?t=day',
    'https://www.reddit.com/r/Cricket/top/.rss?t=day',
    'https://www.reddit.com/r/india/top/.rss?t=day',
    'https://www.reddit.com/r/bollywood/top/.rss?t=day',
    'https://www.reddit.com/r/history/top/.rss?t=day',
    'https://www.reddit.com/r/etymology/top/.rss?t=week',

    // ─── Science & Space ───
    'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'https://hnrss.org/frontpage',
    'https://www.wired.com/feed/rss',
    'https://www.technologyreview.com/feed/',

    // ─── Trivia & History ───
    'https://allthatsinteresting.com/feed',
    'https://www.theguardian.com/world/rss',

    // ─── Sports ───
    'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',

    // ─── Google News Searches (category-specific) ───
    'https://news.google.com/rss/search?q=site:wikipedia.org+"on+this+day"',
    'https://news.google.com/rss/search?q=site:screenrant.com+origins+OR+easter+eggs',
    'https://news.google.com/rss/search?q=site:imdb.com+trivia',
    'https://news.google.com/rss/search?q=site:buzzfeed.com+trivia+OR+facts',
    'https://news.google.com/rss/search?q=film+marketing+controversy+cameo',
    'https://news.google.com/rss/search?q=etymology+word+origin+coined',
    'https://news.google.com/rss/search?q=olympics+unusual+records+discontinued',
    'https://news.google.com/rss/search?q="India+connection"+OR+"Indian+origin"+interesting',
    'https://news.google.com/rss/search?q="did+you+know"+OR+"things+you+did\'t+know"',
];

export const fetchNewsFromFeeds = async (): Promise<ParsedNewsItem[]> => {
    const allNews: ParsedNewsItem[] = [];

    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            for (const item of feed.items) {
                if (item.title && item.link) {
                    // Try RSS image first, then OG image scraping
                    let imageUrl = extractImage(item);
                    if (!imageUrl) {
                        imageUrl = await scrapeOgImage(item.link);
                    }
                    allNews.push({
                        title: item.title,
                        link: item.link,
                        description: cleanRSSContent(item.contentSnippet || item.content || ''),
                        pubDate: item.pubDate || new Date().toISOString(),
                        imageUrl
                    });
                }
            }
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedUrl}:`, error);
        }
    }

    return allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
};
