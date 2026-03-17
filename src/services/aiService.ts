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
DOMAIN: ENTERTAINMENT — Bollywood & Hollywood (Celebrities, Shows, Albums)
ANGLES TO LOOK FOR:
- Origin: How a celebrity got their break / was discovered / almost wasn't cast
- Alter ego / Real name: Stage names, name changes, hidden identities
- Rivalries & feuds: Behind-the-scenes fallouts that shaped careers or projects
- Unexpected collaborations: Two stars working together nobody expected
- Crossover: Bollywood actor in Hollywood, or vice versa
- India connection: International celebrity with Indian roots, training, or influence
- Inspiration: A song/album/show inspired by a real event or person
- Records: Highest-paid, most-streamed, fastest to X ever
- Controversies: Plagiarism, ghostwriting, lip-sync scandals
- Legacy: A show/song that permanently changed culture
- Casting almost-was: Famous roles that almost went to someone else

KEYWORD PATTERNS TO SEARCH:
"[Celebrity] real name" | "[Celebrity] almost cast in" | "[Show] based on true story"
"[Celebrity] Indian connection" | "[Song] plagiarism accusation" | "[Film] originally cast"
"[Award show] scandal" | "Bollywood inspired by Hollywood" | "[Indian film] remake of"`,

        music: `
DOMAIN: MUSIC
ANGLES TO LOOK FOR:
- Song origin: What real event, person, or emotion inspired the song
- Hidden meaning: Lyrics that mean something different from what people think
- Samples: Famous songs built on a sample nobody knew about
- Record broken: Fastest to X streams, longest at #1, youngest artist
- Ghostwriting: A famous song actually written by someone else
- India connection: Western song sampling Indian classical / Bollywood
- Banned / Censored: Songs banned by governments or platforms
- One-take / accident: Famous recordings made by accident or in one take
- Feuds: Songs written as a direct response to another artist
- Legacy: A song that changed the music industry
- Etymology: Where music terms come from (e.g. where did "jazz" come from?)

KEYWORD PATTERNS TO SEARCH:
"[Song] inspired by" | "[Song] sample origin" | "[Artist] ghostwritten by" | "[Song] banned in"
"[Song] hidden meaning" | "[Artist] record first" | "[Artist] India connection"
"[Song] plagiarism lawsuit" | "[Genre] origin history" | "[Instrument] invented by"`,

        science: `
DOMAIN: SCIENCE & SPACE
ANGLES TO LOOK FOR:
- Discovery origin: How the discovery was made — especially if accidental
- Named after: Who or what something is named after, and why
- India connection: Indian scientist behind a global discovery; named after an Indian
- Counterintuitive: A scientific fact that contradicts what most people believe
- Record: Largest, smallest, hottest, coldest, fastest ever measured
- First: First time something was observed, measured, or achieved in space
- Controversy: Credit disputes, stolen discoveries, suppressed findings
- Origin of a concept: Where a fundamental idea (gravity, DNA, atom) actually came from
- Animal inspiration: Breakthrough inspired by an animal's biology
- Failed experiment that worked: Discoveries from accidents or failures
- India's first: First Indian in space, first Indian satellite, etc.

KEYWORD PATTERNS TO SEARCH:
"[Discovery] discovered by accident" | "[Concept] named after" | "[Scientific term] origin"
"[Discovery] Indian scientist" | "India's first [space/science achievement]"
"[Discovery] credit dispute" | "[Space mission] failed but" | "[Topic] debunked"`,

        history: `
DOMAIN: HISTORY & "TODAY IN HISTORY"
ANGLES TO LOOK FOR:
- Historical coincidence: Two unrelated events that happened on the same date
- Counterfactual: How one small decision changed everything
- Forgotten figure: The person who ACTUALLY did something, not the famous one
- India connection: An international historical event with an Indian link
- Origin story: Where a modern institution, tradition, or law actually came from
- Myth-buster: A famous historical "fact" that is actually wrong
- Today in history: Significant event on today's date
- Named after: Something everyone uses, named after a real person (eponyms)
- Parallel: A modern event that mirrors something from history exactly
- Hidden history: Something deliberately erased or forgotten from textbooks
- Odd laws / customs: Strange historical rules that once existed

KEYWORD PATTERNS TO SEARCH:
"[Date] today in history" | "[Historical figure] forgotten" | "[Event] India connection"
"[Modern thing] origin history" | "[Famous fact] debunked" | "first time in history [phenomenon]"
"[Country] hidden history" | "[Event] parallel to today" | "[Historical event] untold story"`,

        animals: `
DOMAIN: ANIMALS & NATURE
ANGLES TO LOOK FOR:
- Counterintuitive biology: Animals that do something you'd never expect
- Extreme records: Loudest, fastest, oldest, deadliest, strangest
- India connection: Animal species discovered in India, or iconic to India
- Human-animal story: Extraordinary bond or interaction between humans and animals
- New species discovered: Recently identified species, especially in India
- Named after: Species named after famous people (including Indians)
- Conservation story: An animal that came back from the brink
- Animal inspiration: Technology or medicine inspired by animal biology
- Myth-buster: Common animal "facts" that are wrong
- Origin of animal names: Why we call them what we call them
- Strange behaviour: Animals doing things that seem almost human
- Extinction story: An animal we lost, and the story behind it

KEYWORD PATTERNS TO SEARCH:
"[Animal] can actually" | "[Animal] world record" | "[Animal] named after"
"new species discovered India" | "[Animal] inspired invention" | "[Animal] myth debunked"
"[Animal] almost extinct" | "[Animal] India connection" | "oldest living [animal]"`,

        technology: `
DOMAIN: TECHNOLOGY & AI
ANGLES TO LOOK FOR:
- Origin story: How a now-ubiquitous technology was actually invented
- Accidental invention: Tech that was discovered by mistake
- Named after: Products, formats, or technologies named after people/places (bluetooth, pixel, spam)
- India connection: Indian inventor or institution behind a global technology
- India's first: First Indian app, chip, satellite, AI model
- Abandoned / forgotten tech: Technology that existed but was killed
- Controversy: Patent disputes, stolen credit, Big Tech scandals
- AI milestone: First time AI did something considered "impossible"
- Unintended consequence: A technology built for X that changed Y entirely
- Prediction that came true: Old sci-fi or forecast that turned out accurate
- Etymology: Where tech terms come from (bluetooth, pixel, bug, spam, podcast)

KEYWORD PATTERNS TO SEARCH:
"[Technology] invented by accident" | "[Tech term] origin of word" | "[Technology] named after"
"[Tech] Indian inventor" | "India's first [technology]" | "[Company] founded by Indian"
"[Technology] killed by [company]" | "[AI milestone] first ever" | "[Sci-fi prediction] came true"`,

        geography: `
DOMAIN: GEOGRAPHY & WORLD RECORDS
ANGLES TO LOOK FOR:
- Counterintuitive geography: Facts that contradict mental maps
- Name origin: Where a country, city, or place name actually comes from
- India connection: A global geographical record held by an Indian place
- Border stories: Strange borders, enclaves, disputed territories
- Record: Largest, smallest, highest, deepest, hottest, oldest
- Only place in the world: Something that only exists in one specific location
- Hidden geography: Places that most people don't know exist
- Changed over time: Countries that used to exist, borders that moved
- Named after: Places named after people, animals, or events
- India's geography superlatives: India's highest, largest, first, only
- Natural wonder explanation: The science behind a stunning natural phenomenon

KEYWORD PATTERNS TO SEARCH:
"[Country/City] name origin" | "[Country] world record" | "India's largest / highest / only"
"only place in the world [phenomenon]" | "[Country] strange law" | "[Border] disputed territory story"
"[Country] used to be called" | "[Natural wonder] how it formed"`,

        health: `
DOMAIN: HEALTH & BODY
ANGLES TO LOOK FOR:
- Counterintuitive health fact: Something we do daily with a surprising effect
- Body record: Extreme human biological achievements
- Myth-buster: Common health advice that is actually wrong
- India connection: Ayurvedic origin of a practice now mainstream globally
- Discovery origin: How a major medical breakthrough was actually found
- Named after: Diseases, syndromes named after people
- Accidental cure: A treatment discovered by mistake
- Ancient vs. modern: A modern practice with ancient origins
- Strange condition: Rare medical conditions that sound fictional
- Psychology quirk: Cognitive biases most people experience
- Placebo / nocebo: Cases where belief literally changed physical outcomes
- Drug origin story: Where a common medicine actually came from

KEYWORD PATTERNS TO SEARCH:
"[Health belief] myth debunked" | "[Disease] named after" | "[Drug] discovered by accident"
"[Health practice] Indian origin" | "Ayurveda origin [modern practice]"
"[Body part / function] counterintuitive fact" | "World record human body"
"[Condition] rarest in the world" | "[Common medicine] originally used for"`,

        sports: `
DOMAIN: SPORTS & ACHIEVEMENTS
ANGLES TO LOOK FOR:
- Record broken: Any world, national, or tournament record — especially unexpected
- Origin story: How a sport, tournament, or tradition actually started
- India connection: An international sporting record with an Indian link
- India's first: First Indian to achieve something in sport
- Forgotten champion: An overlooked Indian sporting hero
- Rivalry backstory: The real story behind a famous rivalry
- Rule origin: Why a sport has a strange or counterintuitive rule
- Almost moment: Famous near-misses or almost-champions
- Controversy: Match-fixing, doping, eligibility scandals
- Named after: Trophies, stadiums, tournaments named after people
- Physics / science of sport: The counterintuitive science behind a famous move
- Non-obvious champion: A country or person dominating a sport you'd never expect

KEYWORD PATTERNS TO SEARCH:
"[Sport] origin history" | "[Rule] why does [sport] have" | "[Tournament] named after"
"[Player] world record" | "first Indian to [achievement]" | "India [sport] forgotten champion"
"[Match] controversy scandal" | "[Country] surprising sport world champion"
"[Trophy/Stadium] named after" | "[Sport] physics science behind"`,

        trending: `
DOMAIN: CONTROVERSIES, VIRAL NEWS & SCANDALS
ANGLES TO LOOK FOR:
- The twist: A viral story where the real truth was different from the viral narrative
- Unlikely villain / hero: Someone cast as one who turned out to be the other
- India connection: An international scandal with an unexpected Indian link
- Origin of the controversy: How a minor incident escalated into a global story
- Corporate scandal: A business behaving badly in a surprising way
- Cover-up revealed: A conspiracy that turned out to be true
- Cancelled then vindicated: Someone cancelled who was later proved right or innocent
- The forgotten one: The person or detail in a scandal that everyone forgot
- Parallel controversy: A current scandal that mirrors a historical one
- Whistleblower story: The person who exposed something, and what happened to them
- The aftermath: Where are they now — the surprising post-scandal story

KEYWORD PATTERNS TO SEARCH:
"[Scandal] real truth" | "[Viral story] debunked" | "[Controversy] India connection"
"[Scandal] whistleblower" | "[Person] cancelled but innocent" | "[Event] cover-up revealed"
"[Controversy] origin how it started" | "[Person] vindicated after"
"[Viral news] what really happened" | "[Corporate scandal] India link"`,

        controversy: `
DOMAIN: CONTROVERSIES, VIRAL NEWS & SCANDALS  
ANGLES TO LOOK FOR:
- The twist: A viral story where the real truth was different from the viral narrative
- Unlikely villain / hero: Someone cast as one who turned out to be the other
- India connection: An international scandal with an unexpected Indian link
- Origin of the controversy: How a minor incident escalated into a global story
- Corporate scandal: A business behaving badly in a surprising way
- Cover-up revealed: A conspiracy that turned out to be true
- Cancelled then vindicated: Someone cancelled who was later proved right or innocent
- Whistleblower story: The person who exposed something, and what happened to them

KEYWORD PATTERNS TO SEARCH:
"[Scandal] real truth" | "[Controversy] India connection" | "[Scandal] whistleblower"
"[Event] cover-up revealed" | "[Controversy] origin how it started" | "[Person] vindicated after"`,
    };

    // ─── INDIA CONNECTION OVERLAY (always appended) ───────────────
    const indiaOverlay = `

UNIVERSAL INDIA CONNECTION CHECK (always run this):
- International figure with Indian ancestry or origin?
- Global trend, word, or phenomenon that traces back to India?
- Record broken by an Indian in an unexpected domain?
- Global brand, product, or organisation with Indian roots?
- "[Topic] India connection" | "[Person] Indian origin" | "[Foreign word] from Sanskrit / Hindi"`;

    // ─── MASTER KEYWORD TEMPLATES (always appended) ───────────────
    const masterTemplates = `

MASTER KEYWORD TEMPLATES — apply to any subject in the article:
"things you didn't know about [X]" | "[X] origin story" | "[X] named after"
"[X] India connection" | "[X] inspired by" | "[X] debunked / myth"
"[X] world record / first" | "[X] controversy / scandal"
"[X] forgotten / overlooked" | "[X] almost was / nearly"
"[X] accidentally invented / discovered" | "Reddit r/todayilearned [X]"`;

    return (chunks[category] || chunks['trending']) + indiaOverlay + masterTemplates;
}

// ─── EVALUATE NEWS (7-Signal Scoring) ────────────────────────────

export const evaluateNews = async (news: ParsedNewsItem, maxRetries: number = 4): Promise<AIEvaluation | null> => {
    console.log('--- ENTERING EVALUATE NEWS FINGERPRINT [v4] ---');
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
| parallelStory | No parallel | Loose similarity | Clear mirror | Exact historical/Indian parallel to a current event |

Also categorize it into ONE of these categories:
"entertainment" | "music" | "sports" | "science" | "history" | "animals" | "technology" | "geography" | "health" | "trending"

News Title: ${news.title}
News Description: ${news.description}
`;

        let attempt = 0;
        let response;
        while (attempt < maxRetries) {
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
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
                break; // success
            } catch (e: any) {
                if (e.message?.includes('429') && attempt < maxRetries - 1) {
                    attempt++;
                    const waitTime = Math.pow(2, attempt) * 6000; // 12s, 24s, 48s
                    console.log(`[evaluateNews] Rate limited (429). Retrying in ${waitTime/1000}s... (Attempt ${attempt}/${maxRetries - 1})`);
                    await new Promise(r => setTimeout(r, waitTime));
                } else {
                    throw e;
                }
            }
        }

        const content = response?.text;
        console.log(`[evaluateNews] Raw Gemini response: ${content?.substring(0, 200)}`);

        if (content) {
            const jsonStr = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(jsonStr) as AIEvaluation;
            if (!parsed.signalScores) {
                throw new Error(`Parsed OK but signalScores missing. Full object: ${JSON.stringify(parsed)}`);
            }
            return parsed;
        }
        throw new Error('Empty response from Gemini');
    } catch (error: any) {
        console.error('Error evaluating news with AI:', error);
        throw error; // Throw so pipelineLogic can catch and log to API logs
    }
};

// ─── GENERATE CONTENT (Full Fact Typology) ───────────────────────

export const generateContent = async (news: ParsedNewsItem, category: string): Promise<AIGeneratedContent | null> => {
    try {
        const domainChunk = getCategoryPromptChunk(category);

        const prompt = `
You are the CHIEF FACT WRITER for IWTK (I Want To Know) — India's #1 "did you know?" curator.
Your sole job: make the reader say "HOLY MOLY, I did NOT know that!" out loud.

IMPORTANT — You are processing THIS specific news item. Generate ALL content based ONLY on this story:
News Title: ${news.title}
News Description: ${news.description}

══════════════════════════════════════════════════════════════════
CRITICAL RULES FOR HEADLINES:
 1. Max 10 words. Must NOT use fake clickbait like "You won't believe". Must stay true and fact-based.
 2. Must use ONE of these 4 techniques to grab attention:
    - CONTRADICTION: "The Country That Banned Homework — And Got Smarter"
    - SPECIFICITY (Numbers): "3,000-Year-Old Honey That's Still Edible"
    - QUESTION: "Why Does Japan Have 7 Million Empty Houses?"
    - STAKES: "The $74M Mission That Beat a $100M Movie to Mars"

══════════════════════════════════════════════════════════════════
CRITICAL RULES FOR "WOW" FACTS:
 1. If the news snippet is thin/vague, DIG DEEPER using your world knowledge to find fascinating related facts.
 2. THE "WOW FACT" RULE: Turn every ordinary fact into a WOW fact.
    - MUST include a specific NUMBER (year, quantity, percentage, distance, or cost).
    - MUST be exactly ONE clear, powerful sentence.
    - Example BEFORE: "India's Mars mission was very cheap."
    - Example AFTER:  "India's Mangalyaan mission cost $74 million — less than the Hollywood movie Gravity ($100M) — and reached Mars on its first attempt."
 3. Each fact must be STANDALONE READABLE — a stranger who hasn't read the article should find it fascinating.
 4. NEVER just summarize the article. Go deeper — find the rabbit hole.

Do not use generic sentences such as "This is more significant than it appears," "If you look closely, it breaks historical precedents," "The immediate aftermath was completely unexpected," "Most readers miss the crucial detail hidden here," or "This could eventually shape future policies."

══════════════════════════════════════════════════════════════════
IWTK FACT TYPOLOGY — Every trivia item MUST be one of these 8 types:

  1. [COUNTERINTUITIVE] Facts that contradict common assumptions.
     GOOD: "Cleopatra lived closer to the Moon landing (1969) than to the building of the pyramids (2500 BC)."
     BAD: "This story is more significant than it appears."

  2. [ORIGIN STORY] The surprising backstory found by going down rabbit holes.
     GOOD: "The word 'salary' comes from sal (salt) because Roman soldiers were sometimes paid in salt."

  3. [WELL-KNOWN NAMES] Little-known stories about famous people or brands.
     GOOD: "Nintendo was founded in 1889 as a playing card company, 100 years before the Game Boy."

  4. [SUPERLATIVE] Only, First, Last, or Extreme records.
     GOOD: "The USB was co-invented by Ajay Bhatt from Gujarat; it's now used by 10 billion devices."

  5. [LOCAL→GLOBAL] A small Indian town or person with massive global impact.
     GOOD: "The 'Bug' in computer science was coined by Grace Hopper after a literal moth was found in her computer in 1947."

  6. [HISTORICAL COINCIDENCES] Two unrelated events happening at the exact same time.
     GOOD: "The same year Darwin published 'Origin of Species' (1859), the first commercial oil well was drilled in the US."

  7. [MYTH-BUSTER] Debunking something widely believed.
     GOOD: "Bulls are actually colorblind to red; they react to the movement of the cape, not its color."

  8. [WORD & ETYMOLOGY] How a word was coined or a brand got its name.
     GOOD: "The word 'Bluetooth' is named after a 10th-century Viking King, Harald Bluetooth, who united Scandinavian tribes."

══════════════════════════════════════════════════════════════════
🚫 BANNED PHRASES — NEVER use these filler sentences:
- "This is more significant than it appears."
- "If you look closely, it breaks historical precedents."
- "The immediate aftermath was completely unexpected."
- "Most readers miss the crucial detail hidden here."
- "This could eventually shape future policies."
══════════════════════════════════════════════════════════════════

${domainChunk}

Return ONLY valid JSON:
{
  "headline": "PUNCHY headline (max 10 words). Add an emoji.",
  "hookSentence": "ONE high-impact sentence that makes you HAVE to read more.",
  "caption": "Short, engaging caption (MAX 50 WORDS). Focus on the 'wow' factor.",
  "hashtags": ["3-5", "relevant", "hashtags"],
  "trivia": [
    "[TYPE] Specific, concrete fact 1...",
    "[TYPE] Specific, concrete fact 2...",
    "[TYPE] Specific, concrete fact 3..."
  ],
  "signalBadge": "The PRIMARY signal: one of '🎲 Surprise' | '🥇 Novelty' | '❤️ Emotion' | '📣 Shareability' | '🇮🇳 India Connection' | '📖 Explainer' | '🔄 Parallel Story'"
}

IMPORTANT: Provide EXACTLY 3 trivia facts. The [TYPE] prefix is for YOUR internal planning only. Remove it from output.

News Title: ${news.title}
News Description: ${news.description}
`;

        let attempt = 0;
        let response;
        while (attempt < 4) {
            try {
                // Use a strict JSON schema to FORCE the model to return trivia as an Array of Strings
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
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
                                trivia: { type: 'ARRAY' as any, items: { type: 'STRING' as any }, description: "EXACTLY 3 specific, concrete, surprising bullet points. NO filler." },
                                signalBadge: { type: 'STRING' as any }
                            },
                            required: ["headline", "hookSentence", "caption", "hashtags", "trivia", "signalBadge"]
                        }
                    }
                });
                break; // success
            } catch (e: any) {
                if (e.message?.includes('429') && attempt < 3) {
                    attempt++;
                    const waitTime = Math.pow(2, attempt) * 6000; // 12s, 24s, 48s
                    console.log(`[generateContent] Rate limited (429). Retrying in ${waitTime/1000}s... (Attempt ${attempt}/3)`);
                    await new Promise(r => setTimeout(r, waitTime));
                } else {
                    throw e; // throw if not 429 or max retries reached
                }
            }
        }

        const content = response?.text;
        if (content) {
            const jsonStr = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            return JSON.parse(jsonStr) as AIGeneratedContent;
        }
        return null;
    } catch (error) {
        console.error('Error generating content with AI:', error);
        return null;
    }
};
