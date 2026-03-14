import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { ParsedNewsItem } from './rssService';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── INTERFACES ──────────────────────────────────────────────────

export interface SignalScores {
    surprise: number;
    novelty: number;
    emotion: number;
    shareability: number;
    indiaConnection: number;
    explainer: number;
    parallelStory: number;
}

export interface AIEvaluation {
    signalScores: SignalScores;
    category: string;
    reason: string;
}

export interface AIGeneratedContent {
    headline: string;
    hookSentence: string;
    caption: string;
    hashtags: string[];
    trivia: string[];
    signalBadge: string;
}

// ─── SIGNAL BADGE MAP ────────────────────────────────────────────

const SIGNAL_LABELS: Record<string, string> = {
    surprise: '🎲 Surprise',
    novelty: '🥇 Novelty',
    emotion: '❤️ Emotion',
    shareability: '📣 Shareability',
    indiaConnection: '🇮🇳 India Connection',
    explainer: '📖 Explainer',
    parallelStory: '🔄 Parallel Story',
};

// ─── THRESHOLD CHECK (Mentor Spec Lines 251) ─────────────────────

export function passesThreshold(scores: SignalScores): boolean {
    const values = Object.values(scores);
    // Rule 1: ≥ 2 on at least one signal
    if (values.some(v => v >= 2)) return true;
    // Rule 2: ≥ 1 on three or more signals
    if (values.filter(v => v >= 1).length >= 3) return true;
    return false;
}

export function getPrimarySignal(scores: SignalScores): string {
    let maxKey = 'surprise';
    let maxVal = 0;
    for (const [key, val] of Object.entries(scores)) {
        if (val > maxVal) {
            maxVal = val;
            maxKey = key;
        }
    }
    return SIGNAL_LABELS[maxKey] || '🎲 Surprise';
}

export function computeOverallScore(scores: SignalScores): number {
    // Map the 0-3 per-signal scores to a 1-10 overall for backward compat
    const values = Object.values(scores);
    const maxSignal = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    // Weighted: primary signal matters most + breadth bonus
    return Math.min(10, Math.round(maxSignal * 2.5 + sum * 0.3));
}

// ─── CATEGORY-SPECIFIC PROMPT CHUNKS ─────────────────────────────

function getCategoryPromptChunk(category: string): string {
    const chunks: Record<string, string> = {
        entertainment: `
DOMAIN-SPECIFIC RULES (ENTERTAINMENT/MOVIES):
Look specifically for these angles:
- Origin: Based on / inspired by / adapted from — book, real person, true story
- Characters: Real-world inspirations for fictional characters
- Inspiration: Costumes, looks, visual styles inspired by something else
- Plagiarism / Controversy: Inspired by or accused of copying another film
- Cameos: Hidden or famous cameo appearances
- Marketing: Unusual campaigns, guerrilla marketing, collabs, billboards, installations
- Records: Box office, production, first-of-its-kind achievements
- Legacy: Impact on pop culture, influence on later films or society
- Crossover: Unexpected connections between franchises or genres
- Production: Behind-the-scenes oddities, accidents, improvised scenes
- Easter Eggs: Hidden references embedded in the film`,

        music: `
DOMAIN-SPECIFIC RULES (MUSIC):
Look specifically for these angles:
- Song origin: What real event, person, or emotion inspired the song
- Hidden meaning: Lyrics that mean something different from what people think
- Samples: Famous songs built on a sample nobody knew about
- Record broken: Fastest to X streams, longest at #1, youngest artist
- Ghostwriting: A famous song actually written by someone else
- India connection: Western song sampling Indian classical / Bollywood
- Banned / Censored: Songs banned by governments or platforms
- One-take / accident: Famous recordings made by accident or in one take
- Feuds: Songs written as a direct response to another artist
- Legacy: A song that changed the music industry`,

        sports: `
DOMAIN-SPECIFIC RULES (SPORTS):
Look specifically for these angles:
- Record broken: Any world, national, or tournament record — especially unexpected
- Origin story: How a sport, tournament, or tradition actually started
- India connection: An international sporting record with an Indian link
- India's first: First Indian to achieve something in sport
- Forgotten champion: An overlooked Indian sporting hero
- Rivalry backstory: The real story behind a famous rivalry
- Rule origin: Why a sport has a strange or counterintuitive rule
- Almost moment: Famous near-misses or almost-champions
- Named after: Trophies, stadiums, tournaments named after people
- Physics / science of sport: The counterintuitive science behind a famous move
- Non-obvious champion: A country or person dominating a sport you'd never expect`,

        science: `
DOMAIN-SPECIFIC RULES (SCIENCE & SPACE):
Look specifically for these angles:
- Discovery origin: How the discovery was made — especially if accidental
- Named after: Who or what something is named after, and why
- India connection: Indian scientist behind a global discovery; named after an Indian
- Counterintuitive: A scientific fact that contradicts what most people believe
- Record: Largest, smallest, hottest, coldest, fastest ever measured
- First: First time something was observed, measured, or achieved
- Failed experiment that worked: Discoveries from accidents or failures
- Animal inspiration: Breakthrough inspired by an animal's biology
- India's first: First Indian satellite, space mission, etc.`,

        history: `
DOMAIN-SPECIFIC RULES (HISTORY):
Look specifically for these angles:
- Historical coincidence: Two unrelated events that happened on the same date
- Counterfactual: How one small decision changed everything
- Forgotten figure: The person who actually did something, not the famous one
- India connection: An international historical event with an Indian link
- Origin story: Where a modern institution, tradition, or law actually came from
- Myth-buster: A famous historical "fact" that is actually wrong
- Named after: Something everyone uses, named after a real person (eponyms)
- Hidden history: Something deliberately erased or forgotten from textbooks
- Parallel: A modern event that mirrors something from history exactly`,

        animals: `
DOMAIN-SPECIFIC RULES (ANIMALS & NATURE):
Look specifically for these angles:
- Counterintuitive biology: Animals that do something you'd never expect
- Extreme records: Loudest, fastest, oldest, deadliest, strangest
- India connection: Animal species discovered in India, or iconic to India
- New species discovered: Recently identified species
- Named after: Species named after famous people (including Indians)
- Conservation story: An animal that came back from the brink
- Animal inspiration: Technology or medicine inspired by animal biology
- Myth-buster: Common animal "facts" that are wrong
- Strange behaviour: Animals doing things that seem almost human`,

        technology: `
DOMAIN-SPECIFIC RULES (TECHNOLOGY & AI):
Look specifically for these angles:
- Origin story: How a now-ubiquitous technology was actually invented
- Accidental invention: Tech that was discovered by mistake
- Named after: Products named after people/places (bluetooth, pixel, spam)
- India connection: Indian inventor or institution behind a global technology
- India's first: First Indian app, chip, satellite, AI model
- Abandoned / forgotten tech: Technology that existed but was killed
- AI milestone: First time AI did something considered "impossible"
- Unintended consequence: A technology built for X that changed Y entirely
- Prediction that came true: Old sci-fi or forecast that turned out accurate`,

        geography: `
DOMAIN-SPECIFIC RULES (GEOGRAPHY & WORLD RECORDS):
Look specifically for these angles:
- Counterintuitive geography: Facts that contradict mental maps
- Name origin: Where a country, city, or place name actually comes from
- India connection: A global geographical record held by an Indian place
- Border stories: Strange borders, enclaves, disputed territories
- Only place in the world: Something that only exists in one specific location
- Hidden geography: Places that most people don't know exist
- Changed over time: Countries that used to exist, borders that moved`,

        health: `
DOMAIN-SPECIFIC RULES (HEALTH & BODY):
Look specifically for these angles:
- Counterintuitive health fact: Something we do daily with a surprising effect
- Myth-buster: Common health advice that is actually wrong
- India connection: Ayurvedic origin of a practice now mainstream globally
- Discovery origin: How a major medical breakthrough was found
- Named after: Diseases, syndromes named after people
- Accidental cure: A treatment discovered by mistake
- Strange condition: Rare medical conditions that sound fictional
- Psychology quirk: Cognitive biases most people experience
- Drug origin story: Where a common medicine actually came from`,
    };
    return chunks[category] || '';
}

// ─── EVALUATE NEWS (7-Signal Scoring) ────────────────────────────

export const evaluateNews = async (news: ParsedNewsItem): Promise<AIEvaluation | null> => {
    try {
        const prompt = `
You are a content strategist for IWTK (I Want To Know), a curated "did you know?" engine.
This is NOT a news feed. Every item must make the reader think: "I did NOT know that."

Score this story 0-3 on EACH of these 7 signals:

| Signal | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| surprise | Expected | Mildly unexpected | Contradicts assumption | Completely counterintuitive / Reveals unexpected connection |
| novelty | Nothing new | Minor first | Clear record/first | World/national first / Only ever / Last ever |
| emotion | Neutral | Mild reaction | Strong reaction | Visceral / jaw-dropping / makes you gasp or smile |
| shareability | No impulse | Maybe | Likely | Instant "you HAVE to tell someone this" |
| indiaConnection | None | Loose | Clear link | Unexpected Indian link to global/international story |
| explainer | No backstory | Minor context | Clear origin story | Deep rabbit hole / The "how did we get here?" story |
| parallelStory | No parallel | Loose similarity | Clear mirror | Exact exact historical/Indian parallel to a current event |

Also categorize it into ONE of these categories:
"entertainment" | "music" | "sports" | "science" | "history" | "animals" | "technology" | "geography" | "health" | "trending"

Return ONLY valid JSON:
{
  "signalScores": {
    "surprise": 0-3,
    "novelty": 0-3,
    "emotion": 0-3,
    "shareability": 0-3,
    "indiaConnection": 0-3,
    "explainer": 0-3,
    "parallelStory": 0-3
  },
  "category": "one of the categories above",
  "reason": "Which signal(s) scored highest and why (1 line)"
}

News Title: ${news.title}
News Description: ${news.description}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const content = response.text;
        if (content) {
            return JSON.parse(content) as AIEvaluation;
        }
        return null;
    } catch (error) {
        console.error('Error evaluating news with AI:', error);
        return null;
    }
};

// ─── GENERATE CONTENT (Full Fact Typology) ───────────────────────

export const generateContent = async (news: ParsedNewsItem, category: string): Promise<AIGeneratedContent | null> => {
    try {
        const domainChunk = getCategoryPromptChunk(category);

        const prompt = `
You are an expert content creator for IWTK (I Want To Know), a curated "did you know?" engine.
Every item must make the reader think: "I did NOT know that."

Convert this news into an IWTK card. Dig deep — find the most mind-bending, rabbit-hole detail.

CRITICAL RULES FOR "trivia":
1. DO NOT write generic philosophical statements, filler text, or vague commentary (e.g., NEVER write "This is the kind of story that makes you question everything").
2. The "trivia" array MUST contain exactly 5 specific, concrete, surprising facts.
3. If the provided news snippet does not contain 5 deep rabbit-hole facts, YOU MUST USE YOUR OWN WORLD KNOWLEDGE to find fascinating backstories, historical parallels, origin stories, or related rabbit-holes to reach 5 points. Do not just summarize the news; enrich it.
4. STRIP ALL BOILERPLATE: Ignore and do not include mentions of "breaking news email", "newsletter", "follow us on social media", "podcast", or "app" from the source snippet. These MUST NOT appear in your output.

Return ONLY valid JSON:
{
  "headline": "A SHORT, PUNCHY headline (max 15 words) in 'did you know' voice. Must make reader STOP scrolling.",
  "hookSentence": "1-2 sentences of THE most interesting part. The hook that makes you need to read more.",
  "caption": "Full engaging caption with emojis telling the complete story.",
  "hashtags": ["5", "relevant", "hashtags"],
  "trivia": ["Fact 1", "Fact 2", "Fact 3", "Fact 4", "Fact 5"], // MUST BE EXACTLY 5 FASCINATING FACTS (BULLET POINTS)
  "signalBadge": "The PRIMARY signal this story hits: one of '🎲 Surprise' | '🥇 Novelty' | '❤️ Emotion' | '📣 Shareability' | '🇮🇳 India Connection' | '📖 Explainer' | '🔄 Parallel Story'"
}

FACT TYPOLOGY - WHAT MAKES A FACT INTERESTING (Prioritize these types):
1. Counterintuitive — "Cleopatra lived closer in time to the Moon landing than to the pyramids"
2. Little-known facts about well-known names — Famous people with unknown stories
3. Origin stories — Found by going down rabbit holes; the backstory nobody tells (e.g., how a brand got its name)
4. Only / First / Last / Superlatives — "First Indian woman to…", "Only person who ever…", "Largest ever recorded…"
5. Local-to-global — A small Indian town or person with massive global impact
6. Historical coincidences — Two unrelated events happening at the exact same time
7. Myth-busters — Debunking something widely believed
8. Word & Etymology stories — How a word was coined, a new term entering the language, eponyms
9. Listicles — "Top 10 / Top 5 things you didn't know / most visited places in the world"
10. Process & Impact — "How XYZ was made" / "How XYZ impacts mental health / society"

CRITICAL: For each of the 5 points in the "trivia" array, YOU MUST assign it one of the types above.
If the provided news description is thin, YOU MUST USE YOUR WORLD KNOWLEDGE to find these specific types of facts related to the topic.

${domainChunk}

HEADLINE RULES:
- Must be attention-grabbing and hit Surprise, Emotion, or Shareability
- Examples: "🤯 The Word 'Bluetooth' Is Named After a Viking King", "This Banned Olympic Sport Will Shock You"

News Title: ${news.title}
News Description: ${news.description}
`;

        // Use a strict JSON schema to FORCE the model to return trivia as an Array of Strings
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT' as any,
                    properties: {
                        headline: { type: 'STRING' as any },
                        hookSentence: { type: 'STRING' as any },
                        caption: { type: 'STRING' as any },
                        hashtags: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
                        trivia: { type: 'ARRAY' as any, items: { type: 'STRING' as any }, description: "EXACTLY 5 specific, concrete, surprising bullet points. NO generic filler." },
                        signalBadge: { type: 'STRING' as any }
                    },
                    required: ["headline", "hookSentence", "caption", "hashtags", "trivia", "signalBadge"]
                }
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
