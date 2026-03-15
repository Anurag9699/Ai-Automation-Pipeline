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

export function getContextualImage(title: string): string {
    const seed = encodeURIComponent(title.substring(0, 30));
    return `https://picsum.photos/seed/${seed}/800/600`;
}


export const RSS_FEEDS = [
    // World & Tech
    'https://www.theguardian.com/world/rss',
    'https://www.wired.com/feed/rss',
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    // Science & Health
    'https://www.nasa.gov/news-release/feed/',
    'https://www.sciencedaily.com/rss/top/science.xml',
    'https://www.who.int/rss-feeds/news-english.xml',
    // Sports
    'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    'https://www.skysports.com/rss/12040', // Football
    // Entertainment & Culture
    'https://allthatsinteresting.com/feed',
    'https://variety.com/feed/',
];

// Helper function to fetch a URL with a strict timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 10000) {
    return new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), timeoutMs);
        parser.parseURL(url)
            .then(res => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

export const fetchNewsFromFeeds = async (): Promise<ParsedNewsItem[]> => {
    const allNews: ParsedNewsItem[] = [];

    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await fetchWithTimeout(feedUrl, 10000);
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
