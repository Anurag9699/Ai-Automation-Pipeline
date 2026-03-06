import Parser from 'rss-parser';

const parser = new Parser();

export interface ParsedNewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
}

const RSS_FEEDS = [
    // 1. Reddit Communities (High Signal Trivia)
    'https://www.reddit.com/r/todayilearned/top/.rss?t=day',
    'https://www.reddit.com/r/science/top/.rss?t=day',
    'https://www.reddit.com/r/worldnews/top/.rss?t=day',
    'https://www.reddit.com/r/movies/top/.rss?t=day',
    'https://www.reddit.com/r/Cricket/top/.rss?t=day',

    // 2. High-Quality Tech & Science
    'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'https://hnrss.org/frontpage', // Hacker News
    'https://www.wired.com/feed/rss',
    'https://www.technologyreview.com/feed/', // MIT Tech Review

    // 3. Niche Trivia & History
    'https://www.cracked.com/rss.xml',
    'https://allthatsinteresting.com/feed',
    'https://www.nosuchthingasafish.com/feed/podcast',
    'https://www.theguardian.com/world/rss',

    // 4. Sports Direct Feeds
    'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',

    // 5. Google News Search (Simulating sites without clean feeds)
    // Wikipedia & Fact Checking
    'https://news.google.com/rss/search?q=site:wikipedia.org+"on+this+day"',
    'https://news.google.com/rss/search?q=site:snopes.com',

    // Movies & Entertainment 
    'https://news.google.com/rss/search?q=site:screenrant.com+origins+OR+easter+eggs',
    'https://news.google.com/rss/search?q=site:imdb.com+trivia',
    'https://news.google.com/rss/search?q=site:indiewire.com+interview+inspiration',
    'https://news.google.com/rss/search?q=site:subslikescript.com',
    'https://news.google.com/rss/search?q=site:buzzfeed.com+trivia+OR+facts',
    'https://news.google.com/rss/search?q=site:scoopwhoop.com+movies+facts',

    // Substacks & Newsletters
    'https://news.google.com/rss/search?q=site:substack.com+"india+wants+to+know"+OR+" trivia"',
    'https://news.google.com/rss/search?q=site:nowiknow.com',

    // 6. Broad Category Fallbacks (Movies, Sports, Trending)
    'https://news.google.com/rss/search?q=film+marketing+controversy+cameo',
    'https://news.google.com/rss/search?q=olympics+unusual+records+discontinued',
    'https://news.google.com/rss/search?q=football+club+origin+jersey+history',
    'https://news.google.com/rss/search?q=cricket+mascot+world+cup+first+time',
    'https://news.google.com/rss/search?q=etymology+word+origin+coined',
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
