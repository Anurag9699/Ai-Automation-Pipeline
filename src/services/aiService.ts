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
Rate this news from 1-10 for Instagram engagement potential. A story is highly interesting (high score) if it scores high on at least 1 of these signals:
1. Surprise: Contradicts common assumptions (e.g. turns out X has an Indian connection).
2. Novelty: First time something has happened, or a record broken.
3. Emotion: Triggers awe, outrage, delight, curiosity, or is wholesome.
4. Shareability: "You won't believe this", "Things you didn't know", or "Funfact" type quality that makes people want to tell someone.
5. India connection: An unexpected connection of a global/international news item that has an Indian connection.
6. Explainer: For a currently trending topic, finding an origin story or explainer about where it originated from.

Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown blocks (like \`\`\`json):
{
 "score": number, // 1-10
 "category": "trending" | "entertainment" | "sports" | "controversy" | "science" | "history" | "animals" | "technology" | "geography" | "health",
 "reason": "Short reason explaining which signals (Surprise, Novelty, India connection, etc.) it matched and why it got this score"
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

TRIVIA FRAMEWORKS (You MUST frame the "trivia" field using one of these hooks if applicable. A story is interesting if it uses at least 1 of these signals):
1. Surprise: Contradicts common assumptions ("turns out X is wrong", or turns out that X has an Indian connection - e.g. Ayatollah Khomeini from Iran died, he has a half brother in UP).
2. Novelty: First time something has happened, or a record broken.
3. Emotion: Triggers awe, outrage, delight, or curiosity OR wholesome.
4. Shareability: "You won't believe this", "Things you didn't know", "Did you know", or "Funfact" type quality — makes people want to tell someone.
5. India connection: An unexpected connection of a global or international news item that has an Indian connection. (e.g. Ayatollah Khomeini has a brother in Lucknow from UP in India).
6. Explainer: For a currently trending topic like a World Cup or global event, find an origin story or an explainer about where it originated from.

Choose the framework or signal that best fits the source to create the most mind-blowing trivia possible.

IMPORTANT RULES for headline:
- Must be attention-grabbing and hit one of the signals (Surprise, Emotion, Shareability).
- Examples: "🤯 You Won't Believe This Indian Connection", "This Bizarre Record Was Just Broken Forever"

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
