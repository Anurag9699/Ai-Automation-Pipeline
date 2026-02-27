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
You are a content strategist. 
Rate this news from 1-10 for Instagram engagement potential.
Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown blocks (like \`\`\`json):
{
 "score": number, // 1-10
 "category": "entertainment" | "current" | "other",
 "reason": "short reason why it got this score"
}

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
You are an expert Instagram content creator.
Convert this news into an Instagram post.
Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown blocks (like \`\`\`json):
{
  "caption": "Exciting and engaging Instagram caption with emojis",
  "hashtags": ["list", "of", "5", "hashtags"],
  "trivia": "A short, interesting trivia fact related to the news",
  "mcq": {
    "question": "An engaging multiple choice question based on the news",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "The exact correct option string from above"
  }
}

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
