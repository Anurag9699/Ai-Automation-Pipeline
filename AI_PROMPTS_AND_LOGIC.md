# IWTK (I Want To Know) — AI Pipeline & Prompt Architecture
### A Complete Technical & Strategic Blueprint

> **Author:** Anurag Khubakar
> **Project:** AI-Powered News Curation & Fact Generation Engine
> **Stack:** Node.js · TypeScript · Express · Prisma · PostgreSQL · Google Gemini AI · node-cron

---

## Table of Contents

1. [Project Vision & Problem Statement](#1-project-vision--problem-statement)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [The Two-Stage AI Pipeline](#3-the-two-stage-ai-pipeline)
4. [Prompt A — The Gatekeeper (News Scoring & Filtering)](#4-prompt-a--the-gatekeeper)
5. [Prompt B — The Creator (Content Generation & Fact Typology)](#5-prompt-b--the-creator)
6. [The 8-Point IWTK Fact Typology (Deep Dive)](#6-the-8-point-iwtk-fact-typology)
7. [Prompt Engineering Techniques Used](#7-prompt-engineering-techniques-used)
8. [Code-Level Logical Features](#8-code-level-logical-features)
9. [Prompt C — The Fact Enhancer (Quality Booster)](#9-prompt-c--the-fact-enhancer)
10. [Prompt D — The Headline Rewriter (Clickability Maximizer)](#10-prompt-d--the-headline-rewriter)
11. [Prompt E — The Hashtag & Social Optimizer](#11-prompt-e--the-hashtag--social-optimizer)
12. [Advanced Feature Prompts (Future Roadmap)](#12-advanced-feature-prompts)
13. [RSS Feed Strategy & Source Selection Logic](#13-rss-feed-strategy)
14. [Rate Limit Handling & Resilience](#14-rate-limit-handling--resilience)
15. [Quality Checklist for Mentor Review](#15-quality-checklist-for-mentor-review)

---

## 1. Project Vision & Problem Statement

**The Problem:**
People scroll through hundreds of news headlines daily, but rarely encounter something that genuinely makes them stop and say "I didn't know that!" Most news aggregators focus on *what happened*, not on *the fascinating hidden context behind what happened*.

**Our Solution — IWTK:**
An AI-powered pipeline that:
1. Fetches real-time news from curated RSS feeds.
2. Uses AI to *score* each article on how "fascinating" it is.
3. Generates short, punchy, fact-driven content that follows a strict **8-point Fact Typology**.
4. Serves it on a beautiful, dark-themed dashboard.

**Key Differentiator:**
We don't summarize news — we *mine it for hidden, jaw-dropping context*.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    IWTK PIPELINE                        │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ RSS Feed │───▶│  GATEKEEPER  │───▶│   CREATOR    │   │
│  │ Fetcher  │    │  (Prompt A)  │    │  (Prompt B)  │   │
│  │          │    │  Score 0-21  │    │  8-Typology  │   │
│  └──────────┘    └──────┬───────┘    └──────┬───────┘   │
│                         │                    │           │
│                    Score < 7?            Save to DB      │
│                    ───────▶ REJECT        ───────▶       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              PostgreSQL (Prisma ORM)              │   │
│  │  NewsContent: title, headline, hook, caption,     │   │
│  │  trivia[3], score, signalScores, category, image  │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  Express API + UI   │                    │
│              │  (Dark Theme Cards) │                    │
│              └─────────────────────┘                    │
│                                                         │
│  ⏰ Cron Job: Runs automatically every 3 hours          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. The Two-Stage AI Pipeline

Traditional approaches use a single prompt: "Summarize this news." This fails because:
- It produces generic, boring summaries.
- It doesn't filter out low-quality stories.
- It can't enforce a *specific style* of interesting facts.

**Our approach uses two distinct AI stages:**

| Stage | Name | Purpose | Input | Output |
|-------|------|---------|-------|--------|
| **Stage 1** | The Gatekeeper | Score & filter news | Raw RSS item | 7-signal scores + category |
| **Stage 2** | The Creator | Generate engaging content | Filtered news + category | Headline, hook, caption, 3 trivia facts |

**Why Two Stages?**
- **Separation of Concerns:** Scoring logic doesn't pollute creative writing.
- **Quality Gate:** Only articles scoring ≥7/21 reach the Creator.
- **Category Context:** The Gatekeeper's chosen category is passed to the Creator, giving it domain-specific context.

---

## 4. Prompt A — The Gatekeeper

### Purpose
To act as a **quality filter**. It reads each incoming news article and scores it across 7 carefully designed "interestingness signals." Stories that don't meet the threshold are rejected before any content is generated.

### The 7 Signals Explained

| # | Signal | What It Measures | Why It Matters |
|---|--------|-----------------|----------------|
| 1 | **Surprise** | Does this contradict what people assume? | Counterintuitive facts go viral |
| 2 | **Novelty** | Is this a First / Only / Last / Record? | Superlatives are inherently shareable |
| 3 | **Emotion** | Does this make you gasp, laugh, or feel angry? | Emotional content drives engagement |
| 4 | **Shareability** | Would you forward this to a friend? | The "WhatsApp Forward" test |
| 5 | **India Connection** | Does this have a surprising Indian angle? | Local relevance for our core audience |
| 6 | **Explainer** | Is there a hidden backstory or rabbit hole? | Origin stories fascinate people |
| 7 | **Parallel Story** | Does this mirror a historical event? | "History repeats itself" narratives |

### Full Prompt

```text
ROLE:
You are a content strategist for IWTK (I Want To Know), a curated "did you know?" engine.
This is NOT a news feed. Every item must make the reader think: "I did NOT know that."

TASK:
Score this story 0-3 on EACH of these 7 signals:

| Signal          | 0 (Skip)       | 1 (Weak)           | 2 (Good)                | 3 (Exceptional)                                             |
|-----------------|----------------|--------------------|-------------------------|--------------------------------------------------------------|
| surprise        | Expected       | Mildly unexpected  | Contradicts assumption  | Completely counterintuitive / Reveals unexpected connection  |
| novelty         | Nothing new    | Minor first        | Clear record/first      | World/national first / Only ever / Last ever                 |
| emotion         | Neutral        | Mild reaction      | Strong reaction         | Visceral / jaw-dropping / makes you gasp or smile            |
| shareability    | No impulse     | Maybe              | Likely                  | Instant "you HAVE to tell someone this"                      |
| indiaConnection | None           | Loose              | Clear link              | Unexpected Indian link to global/international story         |
| explainer       | No backstory   | Minor context      | Clear origin story      | Deep rabbit hole / The "how did we get here?" story          |
| parallelStory   | No parallel    | Loose similarity   | Clear mirror            | Exact exact historical/Indian parallel to a current event    |

CATEGORIZE into ONE of:
"entertainment" | "music" | "sports" | "science" | "history" | "animals" | "technology" | "geography" | "health" | "trending"

OUTPUT FORMAT — Return ONLY valid JSON:
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
  "category": "chosen category",
  "reason": "1-line explanation of which signal scored highest and why"
}

NEWS TITLE: {{title}}
NEWS DESCRIPTION: {{description}}
```

### Scoring Logic (Code-Level)
```typescript
// A story must score at least 7/21 to pass the gate
function computeOverallScore(scores: SignalScores): number {
    const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return Math.round((total / 21) * 10);  // Normalize to 0-10
}

function passesThreshold(score: number): boolean {
    return score >= 7;  // Only top-third stories make it through
}
```

---

## 5. Prompt B — The Creator

### Purpose
Once a story passes the Gatekeeper, the Creator generates the **user-facing content**: headline, hook sentence, caption, hashtags, and 3 fascinating trivia facts.

### Full Prompt

```text
ROLE:
You are the CHIEF FACT WRITER for IWTK (I Want To Know) — India's #1 "did you know?" curator.
Your sole job: make the reader say "HOLY MOLY, I did NOT know that!" out loud.

FORMAT RULES:
┌─────────────────────────────────────────────────┐
│ headline     → Max 10 words, catchy, specific   │
│ hookSentence → Exactly 1 high-impact sentence   │
│ caption      → Max 50 words, concise summary    │
│ trivia       → EXACTLY 3 facts (JSON array)     │
│ hashtags     → 5 relevant hashtags              │
│ signalBadge  → The dominant signal emoji+label  │
└─────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════
IWTK FACT TYPOLOGY — EVERY trivia item MUST be one of these 8 types:

  1. [COUNTERINTUITIVE] Facts contradicting common assumptions.
     GOOD: "Cleopatra lived closer to the Moon landing (1969) than to the pyramids (2500 BC)."
     BAD:  "This story is more significant than it appears."

  2. [ORIGIN STORY] Backstory from going down rabbit holes.
     GOOD: "The word 'salary' comes from sal (salt) — Roman soldiers were paid in salt."
     BAD:  "The origin of this is interesting."

  3. [WELL-KNOWN NAMES] Hidden stories about famous people/brands.
     GOOD: "Nintendo was founded in 1889 as a playing card company, 100 years before the Game Boy."
     BAD:  "This company has a long history."

  4. [SUPERLATIVE] Only / First / Last / Extreme records.
     GOOD: "The USB was co-invented by Ajay Bhatt from Gujarat; it's used by 10 billion devices."
     BAD:  "This is one of the most impressive achievements in the field."

  5. [LOCAL→GLOBAL] Small Indian town/person with massive global impact.
     GOOD: "Mangalyaan cost $74M—less than the movie 'Gravity'—and reached Mars on its first try."
     BAD:  "India has made many contributions to technology."

  6. [HISTORICAL COINCIDENCE] Two unrelated events at the exact same time.
     GOOD: "The same year Darwin published 'Origin of Species' (1859), the first oil well was drilled."
     BAD:  "Two things happened around the same historical period."

  7. [MYTH-BUSTER] Debunking a popular belief. Must name the myth AND truth.
     GOOD: "Bulls are colorblind to red. They react to the movement of the cape, not its color."
     BAD:  "A common misconception about this topic exists."

  8. [WORD & ETYMOLOGY] How a word was coined or a brand got its name.
     GOOD: "'Bluetooth' is named after Harald Bluetooth—a Viking king who united Scandinavian tribes."
     BAD:  "The etymology of this word is interesting."

══════════════════════════════════════════════════════════════
CRITICAL RULES FOR "WOW" FACTS:
 1. THE "WOW FACT" RULE: Turn every ordinary fact into a WOW fact. 
    - MUST include a specific NUMBER (year, quantity, percentage, distance, or cost).
    - MUST be exactly ONE clear, powerful sentence.
    - Example BEFORE: "India's Mars mission was very cheap."
    - Example AFTER:  "India's Mangalyaan mission cost $74 million — less than the Hollywood movie Gravity ($100M) — and reached Mars on its first attempt."
 2. Each fact must be STANDALONE READABLE.
 3. NEVER just summarize the article. Go deeper — find the rabbit hole.

🚫 BANNED PHRASES — NEVER WRITE THESE (instant quality failure):
- "This is more significant than it appears."
- "If you look closely, it breaks historical precedents."
- "The immediate aftermath was completely unexpected."
- "Most readers miss the crucial detail hidden here."
- "This could eventually shape future policies."
- "Surprising detail: [title]... is more significant..."
- Any sentence that could apply to ANY news story
══════════════════════════════════════════════════════════════

NEWS TITLE: {{title}}
NEWS CATEGORY: {{category}}
NEWS DESCRIPTION: {{description}}
```

---

## 6. The 8-Point IWTK Fact Typology (Deep Dive)

This is the intellectual core of the project. Each type targets a specific psychological trigger:

| # | Type | Psychological Trigger | Example | Why It Works |
|---|------|----------------------|---------|-------------|
| 1 | **Counterintuitive** | Cognitive dissonance | "Cleopatra → Moon landing" | Brain can't reconcile the contradiction, so it remembers |
| 2 | **Origin Story** | Narrative curiosity | "Salary → salt → Roman soldiers" | Humans are wired for "how did this begin?" |
| 3 | **Well-Known Names** | Celebrity proximity effect | "Nintendo → 1889 playing cards" | Familiar anchor + unknown fact = maximum surprise |
| 4 | **Superlative** | Status & ranking instinct | "First Indian woman to..." | We instinctively pay attention to extremes |
| 5 | **Local→Global** | National pride + surprise | "USB → Gujarat engineer" | Unexpected local connection to global thing |
| 6 | **Historical Coincidence** | Pattern recognition | "Darwin + Oil well = 1859" | Brain loves finding hidden patterns |
| 7 | **Myth-Buster** | Correction impulse | "Bulls are colorblind to red" | We urgently want to share corrections |
| 8 | **Word & Etymology** | Linguistic curiosity | "Bluetooth → Viking king" | Words we use daily suddenly have a hidden story |

### Why Exactly 3 Facts?
- **1 fact** feels like trivia, not a feature.
- **5 facts** causes "scroll fatigue" — users stop reading.
- **3 facts** is the "Goldilocks zone" — enough to impress, short enough to finish.

---

## 7. Prompt Engineering Techniques Used

These are the specific techniques that make our prompts work better than simple instructions:

### 7.1 Few-Shot Learning (GOOD/BAD Examples)
Instead of just saying "write interesting facts," we provide concrete GOOD and BAD examples for every typology category. This anchors the AI's understanding of quality.

```text
// Without few-shot:
"Write an interesting fact."
→ AI output: "This is one of the most impressive achievements in the field."  ❌

// With few-shot (our approach):
"[SUPERLATIVE] Only/First/Last records.
 GOOD: 'The USB was co-invented by Ajay Bhatt from Gujarat; it's used by 10 billion devices.'
 BAD:  'This is one of the most impressive achievements in the field.'"
→ AI output: "India's Chandrayaan-3 made it the 4th country to soft-land on the Moon."  ✅
```

### 7.2 Negative Prompting (Banned Phrases)
Explicitly listing what NOT to write is as important as what TO write. Without this, AI defaults to generic filler.

### 7.3 Structured Output (JSON Schema)
By specifying the exact JSON structure, we eliminate parsing errors and ensure the output plugs directly into our database schema.

### 7.4 Role Priming
"You are the CHIEF FACT WRITER for IWTK" — giving the AI a specific, expert role produces higher-quality output than generic instructions.

### 7.5 Separation of Concerns (Two-Stage)
Evaluation and generation are separate prompts. This prevents the scoring logic from "leaking" into the creative writing and vice versa.

---

## 8. Code-Level Logical Features

These features live in the code, not in the prompts, to ensure reliability:

### 8.1 Zero-Tolerance Coherency Policy
**Problem:** When AI is rate-limited, the system needs fallback content. But random facts placed on unrelated news = terrible user experience.

**Solution:**
```
IF AI available → Generate facts FROM the news article itself (100% relevant)
ELSE IF Vault has keyword match → Use only if keywords precisely match the news
ELSE → SKIP the item entirely (better to show nothing than show wrong info)
```

### 8.2 100% Uniqueness Filter
**Problem:** Multiple news stories about similar topics could get the same fallback fact.

**Solution:**
```typescript
const usedHeadlines = new Set<string>();

// Before saving any item:
if (usedHeadlines.has(generated.headline)) {
    skip();  // Never repeat a heading
} else {
    save();
    usedHeadlines.add(generated.headline);  // Mark as used
}
```

### 8.3 Automatic Scheduling (Cron)
```typescript
// Runs every 3 hours, 24/7, without manual intervention
cron.schedule('0 */3 * * *', async () => {
    await runPipeline();
});
```

### 8.4 Rate Limit Resilience
```typescript
// Exponential backoff: 12s → 24s → 48s
while (attempt < maxRetries) {
    try {
        response = await ai.models.generateContent(config);
        break;  // Success
    } catch (error) {
        if (error.status === 429) {
            const delay = 12000 * Math.pow(2, attempt);
            await sleep(delay);
            attempt++;
        }
    }
}
```

---

## 9. Prompt C — The Fact Enhancer (Quality Booster)

### Purpose
An optional third prompt that takes an already-generated fact and makes it **even more specific and jaw-dropping**.

### When to Use
- After Prompt B generates 3 facts, but they feel "okay, not amazing."
- To refine facts that score below 8/10 on the internal quality check.

### Full Prompt
```text
ROLE:
You are a FACT QUALITY INSPECTOR for IWTK. Your job is to take an okay fact
and make it absolutely jaw-dropping by adding specificity.

RULES:
1. Add a NUMBER (year, quantity, percentage, distance, cost).
2. Add a NAME (person, place, brand).
3. Add a COMPARISON ("more than...", "less than...", "same as...").
4. Keep it to ONE sentence maximum.

EXAMPLES OF ENHANCEMENT:

BEFORE: "India's Mars mission was very cheap."
AFTER:  "India's Mangalyaan cost $74 million — less than the budget of the Hollywood movie 'Gravity' ($100M) — and reached Mars on its FIRST attempt."

BEFORE: "The Great Wall of China is very long."
AFTER:  "The Great Wall stretches 21,196 km — if you walked it at 8 hours/day, it would take you 18 months to finish."

BEFORE: "Honey never spoils."
AFTER:  "Archaeologists found 3,000-year-old honey in Egyptian tombs that was still perfectly edible."

INPUT FACT: {{fact}}
OUTPUT: Enhanced version (1 sentence, must include a number + name + comparison)
```

---

## 10. Prompt D — The Headline Rewriter (Clickability Maximizer)

### Purpose
To convert a boring news headline into an IWTK-style "I need to click this" headline.

### Full Prompt
```text
ROLE: You are an IWTK headline specialist.

RULES:
- Max 10 words.
- Must contain either a NUMBER, a QUESTION, or a CONTRADICTION.
- Never use clickbait ("You won't believe...").
- The headline must be TRUE and verifiable.

TECHNIQUES for maximum clickability:
1. CONTRADICTION: "The Country That Banned Homework — And Got Smarter"
2. SPECIFICITY: "3,000-Year-Old Honey That's Still Edible"
3. QUESTION: "Why Does Japan Have 7 Million Empty Houses?"
4. STAKES: "The $74 Million Mission That Beat a $100M Movie to Mars"

ORIGINAL HEADLINE: {{headline}}
REWRITE: (Max 10 words)
```

---

## 11. Prompt E — The Hashtag & Social Optimizer

### Purpose
Generate the perfect hashtags and a "share-ready" one-liner for social media.

### Full Prompt
```text
ROLE: You are a social media strategist for IWTK.

GIVEN this fact: {{fact}}

GENERATE:
1. shareText: A 1-line version of this fact optimized for WhatsApp/Twitter sharing (max 280 chars).
   - Must start with "Did you know?" or "TIL:" or a surprising stat.
2. hashtags: 5 hashtags — mix of broad (#DidYouKnow, #Facts) and specific (#NASA, #Chess).
3. audienceHook: Who would find this most interesting? (e.g., "Perfect for science nerds", "History buffs will love this")

OUTPUT FORMAT (JSON):
{
  "shareText": "...",
  "hashtags": ["#...", "#...", "#...", "#...", "#..."],
  "audienceHook": "..."
}
```

---

## 12. Advanced Feature Prompts (Future Roadmap)

### 12.1 "Visual Proof" Generator
```text
Given this fact: {{fact}}
Suggest a DALL-E/Midjourney prompt that would create a visual that PROVES this fact.
The image should be photorealistic and could be used as a side-by-side comparison.

Example:
Fact: "Nintendo was founded in 1889 as a playing card company."
Image Prompt: "A vintage 1889 Japanese Hanafuda playing card with the Nintendo logo, sepia-toned,
               next to a modern Nintendo Switch, split-screen comparison, museum lighting"
```

### 12.2 "Myth vs. Truth" Interactive Formatter
```text
Given this myth-buster fact: {{fact}}

Split it into exactly two parts:
1. THE MYTH: What most people believe (stated as if true).
2. THE TRUTH: The actual reality (with evidence).

Example:
THE MYTH: "Bulls charge because they hate the color red."
THE TRUTH: "Bulls are dichromatic (colorblind to red). They charge because of the aggressive
            movement of the cape. The red color was chosen to mask blood stains."
```

### 12.3 "Mind-Blown Meter" Auto-Tagger
```text
Given these signal scores: {{signalScores}}

Calculate a "Mind-Blown Level" from 1-5:
- Level 1 (Interesting): Total score 7-9
- Level 2 (Surprising): Total score 10-12
- Level 3 (Jaw-Dropping): Total score 13-15
- Level 4 (Mind-Blown): Total score 16-18
- Level 5 (Life-Changing): Total score 19-21

Also assign an emoji:
Level 1: 💡  Level 2: 😮  Level 3: 🤯  Level 4: 🔥  Level 5: 💀

Output: { "level": 3, "emoji": "🤯", "label": "Jaw-Dropping" }
```

### 12.4 "Connect the Dots" Cross-Reference Engine
```text
ROLE: You are a pattern-matching historian.

CURRENT NEWS: {{currentArticle}}
PREVIOUS 5 FACTS WE PUBLISHED: {{previousFacts}}

TASK: If there is a genuine, non-trivial connection between the current news
and any of the previous 5 facts, describe it in 1 sentence.

If no genuine connection exists, return: { "connection": null }

GOOD: "Just like the 1859 oil discovery we covered yesterday, today's energy crisis
       shows how one resource can reshape global politics for centuries."
BAD:  "This is somewhat related to a previous topic." (too vague — REJECT)
```

### 12.5 Listicle & "How It Was Made" Detector
```text
ROLE: You are a content classifier.

Given this article title: {{title}}

Determine if this article is one of these high-value IWTK formats:
1. LISTICLE: "Top 10 / 5 things you didn't know / most visited places..."
2. HOW-IT-WAS-MADE: "How XYZ was made / built / created / invented"
3. ORIGIN: Articles exploring the backstory of something well-known

If YES → Flag as "HIGH PRIORITY" for the pipeline (auto-score boost +3).
If NO → Process normally.

Output: { "isHighValue": true/false, "format": "listicle|how-made|origin|normal", "boost": 0|3 }
```

---

## 13. RSS Feed Strategy

### Current Feed Categories

| Category | Feeds | Purpose |
|----------|-------|---------|
| **World** | The Guardian (World) | Geopolitical context, human interest |
| **Tech** | Wired, TechCrunch, The Verge | Innovation, gadgets, science |
| **Science** | NASA, ScienceDaily, WHO | Space, health, discoveries |
| **Sports** | ESPNCricinfo, Sky Sports | Cricket, football trivia |
| **Culture** | AllThatsInteresting, Variety | Entertainment, history, oddities |

### Why These Feeds?
- **AllThatsInteresting.com** is the #1 source for our typology — it naturally produces origin stories, myths, and historical coincidences.
- **NASA** provides superlatives and "first ever" facts regularly.
- **The Guardian** gives us the geopolitical backbone for "parallel story" signals.

---

## 14. Rate Limit Handling & Resilience

### Gemini API Free Tier Limits
| Metric | Limit |
|--------|-------|
| Requests per minute | 15 RPM |
| Requests per day | 1,500 RPD |
| Tokens per minute | 1,000,000 TPM |

### Our Strategy
```
1. Exponential Backoff: 12s → 24s → 48s (3 retries)
2. Between pipeline items: 15s cooldown
3. If all retries fail: Use keyword-matched vault OR skip
4. Never: Use an unrelated fact (Zero-Tolerance Policy)
```

---

## 15. Quality Checklist for Mentor Review

Use this checklist to verify the pipeline meets all quality standards:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Every fact follows one of the 8 typology categories | ✅ |
| 2 | No generic filler phrases in any generated content | ✅ |
| 3 | Headlines are ≤10 words | ✅ |
| 4 | Captions are ≤50 words | ✅ |
| 5 | Exactly 3 trivia facts per item | ✅ |
| 6 | No duplicate headings across the dashboard | ✅ |
| 7 | Facts are coherent with the news they appear on | ✅ |
| 8 | Pipeline runs automatically every 3 hours | ✅ |
| 9 | Rate limits are handled gracefully | ✅ |
| 10 | Mismatched items are skipped, not shown | ✅ |
| 11 | Banned phrases are explicitly blocked | ✅ |
| 12 | Few-shot examples guide AI quality | ✅ |

---

*This document is the complete intellectual property and technical blueprint of the IWTK AI Pipeline, developed for mentor review and future reference.*
