import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { ParsedNewsItem } from './rssService';

dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIMetadata {
    score: number;
    category: string;
    reason: string;
}

export interface AIGeneratedContent {
    headline: string;
    caption: string;
    hashtags: string[];
    trivia: string;
    mcq: {
        question: string;
        options: string[];
        correctAnswer: string;
    };
}

export const evaluateNews = async (news: ParsedNewsItem): Promise<AIMetadata | null> => {
    try {
        const prompt = `
You are a content strategist for a viral facts & trivia page.
Rate this news from 1-10 for Instagram engagement potential.
Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown blocks (like \`\`\`json):
{
 "score": number, // 1-10
 "category": "trending" | "entertainment" | "sports" | "controversy" | "science" | "history" | "animals" | "technology" | "geography" | "health",
 "reason": "short reason why it got this score"
}

Category Guide:
- "trending": Hot trending topics, viral moments (Indian & Global)
- "entertainment": Bollywood, Hollywood, music, TV shows, celebrity news
- "sports": Cricket, football, Olympics, any sports achievements
- "controversy": Scandals, viral debates, controversies, shocking news
- "science": Scientific discoveries, space exploration, NASA, ISRO
- "history": Historical events, "Today in History" type facts
- "animals": Wildlife, animal facts, nature discoveries
- "technology": Tech innovations, AI breakthroughs, gadgets
- "geography": World records, geographical facts, Guinness records
- "health": Medical news, health tips, body facts, fitness

News Title: ${news.title}
News Description: ${news.description}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const content = response.text;
        if (content) {
            return JSON.parse(content) as AIMetadata;
        }
        return null;
    } catch (error) {
        console.error('Error evaluating news with AI:', error);
        return null;
    }
};

export const generateContent = async (news: ParsedNewsItem): Promise<AIGeneratedContent | null> => {
    try {
        const prompt = `
You are an expert Instagram content creator who specializes in creating VIRAL, jaw-dropping facts and trivia.

Convert this news/source text into an engaging Instagram post with a focus on HOOKING the reader.
We are looking for deeply fascinating, rabbit-hole style trivia. Pull out the most mind-bending detail from the text.

Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown blocks (like \`\`\`json):
{
  "headline": "A SHORT, PUNCHY, CLICKBAIT-STYLE headline (max 15 words) that makes people STOP scrolling. Use power words.",
  "caption": "Exciting and engaging Instagram caption with emojis that tells the full story in a fun way.",
  "hashtags": ["list", "of", "5", "relevant", "hashtags"],
  "trivia": "The trivia fact generated using one of the TRIVIA FRAMEWORKS or DOMAIN RULES listed below. Make it absolutely fascinating!",
  "mcq": {
    "question": "An engaging multiple choice question based on the fact",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "The exact correct option string from above"
  }
}

TRIVIA FRAMEWORKS (You MUST frame the "trivia" field using one of these hooks if applicable):
1. Counterintuitive: Facts that break expectations (e.g., "Cleopatra lived closer to the Moon landing than the pyramids").
2. Little-known facts: Deeply hidden facts about well-known names.
3. Origin stories: Rabbit hole discoveries about how things started (e.g., "Word originates from...").
4. Superlatives: "Only/First/Last" facts. These perform extremely well.
5. Local-to-global: Something small that has huge implications.
6. Historical coincidences: Two completely unrelated events happening at the exact same time.
7. Myth-busters: Debunking something widely believed.
8. Word Origins/Etymology: Stories of how new words or phrases were coined.
9. Animal behavior surprises: E.g., Octopus intelligence, complex ant colonies.
10. Comparison/Scale facts: Makes abstract numbers tangible (e.g., "If you removed all empty space from atoms, all humans fit in a sugar cube").

DOMAIN-SPECIFIC RULES (If the news is about Movies or Sports, YOU MUST look for these specific angles):
**MOVIES/ENTERTAINMENT:**
- Look for: "Based on", "Inspired by", "Characters based on", or plagiarized ideas.
- Inspirations behind costumes, character looks, or the marketing of the film.
- Unusual Box Office Records or Legacy/Influence in Pop Culture (Crossovers).
- Interview insights from screenwriters/directors or crazy Cameo appearances.
- Controversies or insane Production facts.

**SPORTS (Cricket, Football, Olympics):**
- Unusual records, unusual achievements, or bizarre events on the field.
- Mascots of World Cups, or origins of Football Club names/Jerseys.
- "First time in XX years", or players/stadiums "named after...".
- Olympics: Unusual or discontinued sports, highly controversial moments, "First Woman" or "First Indian" to do X.

Choose the framework or domain rule that best fits the source to create the most mind-blowing trivia possible.

IMPORTANT RULES for headline:
- Must be attention-grabbing and make the user highly curious.
- Examples: "🤯 The Hidden Inspiration Behind Bollywood's Most Famous Look", "This Bizarre Olympic Sport Was Banned Forever"

News Title: ${news.title}
News Description: ${news.description}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const content = response.text;
        if (content) {
            return JSON.parse(content) as AIGeneratedContent;
        }
        return null;
    } catch (error) {
        console.error('Error generating content with AI:', error);
        return null;
    }
};
