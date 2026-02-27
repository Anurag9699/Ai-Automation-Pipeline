# AI Automation Pipeline

An AI-powered news automation platform that discovers trending news via RSS feeds, evaluates content with **Google Gemini 2.5 Flash**, and transforms high-scoring articles into Instagram-ready captions, trivia facts, and interactive quiz questions.

## Features

- **Automated Pipeline** — Fetches news from Google News RSS feeds every 3 hours
- **AI Content Scoring** — Gemini rates each article 1-10 for Instagram engagement
- **Content Generation** — Creates captions, hashtags, trivia facts, and MCQ quiz questions
- **Deduplication** — Redis + in-memory cache prevents processing the same article twice
- **Trivia Encyclopedia** — Browse, search, and filter all generated trivia content
- **Interactive Quiz** — 5-question quiz with 30s timer, scoring, and share functionality
- **Improvement Analysis** — Structured recommendations for website improvements
- **Modern UI** — Bento-grid layout with glassmorphism, animated gradients, and micro-interactions

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Server | Express.js v5 |
| AI | Google Gemini 2.5 Flash |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis (optional) |
| Scheduler | node-cron |
| Frontend | React 18 + Tailwind CSS |

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your .env file:
# - DATABASE_URL: PostgreSQL connection string
# - GEMINI_API_KEY: Google AI API key
# - REDIS_URL: Redis URL (optional)

# Push database schema
npx prisma db push

# Development mode
npm run dev

# Production build
npm run build && npm start
```

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/content` | Fetch all content (supports `?category=` and `?search=`) |
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/pipeline-status` | Real-time pipeline status and logs |
| `GET` | `/api/quiz` | Get 5 random quiz questions |
| `POST` | `/api/trigger` | Manually trigger the pipeline |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `REDIS_URL` | No | Redis connection (falls back to in-memory) |
| `PORT` | No | Server port (default: 3000) |

## Pipeline Architecture

```
RSS Feeds → Dedup Cache → AI Scoring → Content Generation → PostgreSQL
         (Google News)   (Redis)    (Gemini 2.5)   (Gemini 2.5)    (Prisma)
```

Each pipeline run:
1. Fetches 5 latest news items from 3 RSS feeds
2. Checks duplicates against Redis cache and database
3. Sends to Gemini for engagement scoring (1-10)
4. Articles scoring >5 get full content generation
5. Saves caption, trivia, and quiz question to PostgreSQL
