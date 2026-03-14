import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Return JSON: {"hello": "world"}',
            config: { responseMimeType: 'application/json' }
        });
        console.log("response.text type:", typeof response.text);
        if (typeof response.text === 'function') { // wait, if it's a getter...
            console.log("response.text():", response.text);
        } else {
             console.log("response.text value:", response.text);
        }
    } catch(e) {
        console.error("ERROR:", e);
    }
}
main();
