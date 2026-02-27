import Parser from 'rss-parser';

const parser = new Parser();

export interface ParsedNewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

const RSS_FEEDS = [
    'https://news.google.com/rss/search?q=Bollywood',
    'https://news.google.com/rss/search?q=Hollywood',
    'https://news.google.com/rss/search?q=entertainment',
    'https://news.google.com/rss/search?q=current+events+India',
    'https://news.google.com/rss/search?q=world+news+today'
];

export const fetchNewsFromFeeds = async (): Promise<ParsedNewsItem[]> => {
    const allNews: ParsedNewsItem[] = [];

    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            feed.items.forEach(item => {
                if (item.title && item.link) {
                    allNews.push({
                        title: item.title,
                        link: item.link,
                        description: item.contentSnippet || item.content || '',
                        pubDate: item.pubDate || new Date().toISOString()
                    });
                }
            });
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedUrl}:`, error);
        }
    }

    // Sort by pubDate descending (newest first)
    return allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
};
