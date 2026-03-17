import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAI() {
    console.log('Testing Gemini 2.5 Flash API with Schema...');
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Analyze this news: "F1 driver wins championship". Return evaluation.',
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT' as any,
                    properties: {
                        signalScores: {
                            type: 'OBJECT' as any,
                            properties: {
                                surprise:        { type: 'NUMBER' as any },
                                novelty:         { type: 'NUMBER' as any },
                                emotion:         { type: 'NUMBER' as any },
                                shareability:    { type: 'NUMBER' as any },
                                indiaConnection: { type: 'NUMBER' as any },
                                explainer:       { type: 'NUMBER' as any },
                                parallelStory:   { type: 'NUMBER' as any },
                            },
                            required: ['surprise', 'novelty', 'emotion', 'shareability', 'indiaConnection', 'explainer', 'parallelStory']
                        },
                        category: { type: 'STRING' as any },
                        reason:   { type: 'STRING' as any },
                    },
                    required: ['signalScores', 'category', 'reason']
                }
            }
        });
        
        console.log('--- RAW RESPONSE TEXT ---');
        console.log(response.text);
        
        const parsed = JSON.parse(response.text || "{}");
        console.log('--- PARSED OK ---');
        console.log(JSON.stringify(parsed, null, 2));

    } catch (error: any) {
        console.error('!!! API ERROR !!!');
        console.error(error);
    }
}

testAI();
