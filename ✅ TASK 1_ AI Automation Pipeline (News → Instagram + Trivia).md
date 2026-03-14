
Sai’s Prompt from Claude 

# **🧠 IWTK News Aggregator — Vibecoding Prompt**

## **─── OVERVIEW ───────────────────────────────────────────────**

Build a **visually stunning news aggregator** that surfaces only the most *interesting* facts and stories from a chosen time window. This is not a standard news feed — it's a curated "did you know?" engine. Every item displayed must pass an **Interestingness Filter** before appearing on screen.

---

## **─── TIME WINDOWS ───────────────────────────────────────────**

The user can toggle between four lookback periods:

| Label | Duration |
| ----- | ----- |
| This Week | Last 7 days |
| This Month | Last 30 days |
| Last Quarter | Last 3 months |
| This Year | Last 12 months |

---

## **─── THE INTERESTINGNESS FILTER ─────────────────────────────**

A story qualifies as **interesting** if it scores highly on **at least one** of the following signals:

### **1\. 🎲 Surprise**

Contradicts a common assumption or reveals an unexpected connection.

*"Turns out X is actually Y"* / *"X has a surprising Indian connection"* Example: Ayatollah Khomeini had a half-brother living in Lucknow, UP.

### **2\. 🥇 Novelty**

A first, a last, or a record broken.

*"World's first…"* / *"Only woman to ever…"* / *"Largest ever recorded…"*

### **3\. ❤️ Emotion**

Triggers awe, outrage, delight, curiosity, or warmth.

Wholesome stories, jaw-dropping facts, things that make you gasp or smile.

### **4\. 📣 Shareability**

Has the instinctive "you HAVE to tell someone this" quality.

*"You won't believe this…"* / *"Did you know…"* / *"Fun fact:…"* / *"Things you didn't know about…"*

### **5\. 🇮🇳 India Connection**

An unexpected Indian link to a global or international story.

Example: A viral international news item that traces back to an Indian town, person, or event.

### **6\. 📖 Explainer / Origin Story**

For trending topics, surface the origin story, the backstory, or the "how did we get here?" narrative.

Example: For a trending conflict or cultural event, find where it actually began.

### **7\. 🔄 Parallel Story**

A historical or Indian parallel to a current trending story — a "this reminds me of..." comparison that adds depth.

Example: A current political event mirrored by something from 1970s India.

---

## **─── CONTENT CATEGORIES ─────────────────────────────────────**

Stories should be sourced and filtered across the following categories:

| \# | Category |
| ----- | ----- |
| 1 | 🎬 Entertainment — Bollywood, Hollywood, Music, TV Shows |
| 2 | 🏏 Sports & Achievements — Cricket, Football, other sports |
| 3 | ~~💥 Controversies, Viral News & Scandals~~ |
| 4 | 🔬 Science & Space |
| 5 | 🏛️ History & "Today in History" |
| 6 | 🐾 Animals & Nature |
| 7 | 🤖 Technology & AI |
| 8 | 🌍 Geography & World Records |
| 9 | 🏥 Health & Body |

---

## **─── FACT TYPOLOGY: WHAT MAKES A FACT INTERESTING ──────────**

Prioritise facts of the following types:

* **Counterintuitive** — "Cleopatra lived closer in time to the Moon landing than to the pyramids"  
* **Little-known facts about well-known names** — Famous people with unknown stories  
* **Origin stories** — Found by going down rabbit holes; the backstory nobody tells  
* **Only / First / Last / Superlatives** — "First Indian woman to…", "Only person who ever…"  
* **Local-to-global** — A small Indian town or person with massive global impact  
* **Historical coincidences** — Two unrelated events happening at the exact same time  
* **Myth-busters** — Debunking something widely believed  
* **Word & Etymology stories** — How a word was coined, a new term entering the language, eponyms  
* If articles are Listicles “Top 10 / Top 5 things you didnd know / most visited places in the word” , etc.   
* If articles begin with the words “How XYZ was made / How XYZ impacts mental health” 

---

## **─── MOVIES: SPECIALISED INTEREST CRITERIA ──────────────────**

For entertainment/film content, a fact is interesting if it relates to:

| Area | What to Look For |
| ----- | ----- |
| **Origin** | Based on / inspired by / adapted from — book, real person, true story |
| **Characters** | Real-world inspirations for fictional characters |
| **Inspiration** | Costumes, looks, visual styles inspired by something else |
| **Plagiarism / Controversy** | Inspired by or accused of copying another film |
| **Cameos** | Hidden or famous cameo appearances |
| **Marketing** | Unusual campaigns, guerrilla marketing, collabs, billboards, installations |
| **Records** | Box office, production, first-of-its-kind achievements |
| **Legacy** | Impact on pop culture, influence on later films or society |
| **Crossover** | Unexpected connections between franchises or genres |
| **Production** | Behind-the-scenes oddities, accidents, improvised scenes |
| **Easter Eggs** | Hidden references embedded in the film |

---

## **─── SOURCE STRATEGY BY CATEGORY ───────────────────────────**

### **🎬 Movies & Entertainment**

**Sites:** Wikipedia (Origin, Production, Legacy sections), IMDB Trivia, Reddit (`r/todayilearned`, `r/movies`, `r/interestingasfuck`)

**Search keyword patterns:**

* `"[Film Name] inspired by"`  
* `"[Film Name] based on book / real person"`  
* `"[Film Name] remake controversy"`  
* `"[Film Name] cameo appearances"`  
* `"[Film Name] easter eggs"`  
* `"[Film Name] director cameo"`  
* `"[Film Name] movie records first"`  
* `"[Film Name] costume inspired by"`  
* `"[Film Name] plagiarism claims"`  
* `"[Film Name] marketing campaign"`  
* `"things you didn't know about [Film Name]"`

**Interview sources:** Director/screenwriter interviews, DVD commentary, BTS features

---

### **🔬 Science, Technology & Space**

**Sites:** Wikipedia, NASA, Nature, New Scientist, Google Scholar

**Search keyword patterns:**

* `"discovered / invented [year]"`  
* `"World's first [phenomenon]"`  
* `"[Topic] inspired by nature"`  
* `"India's first [scientific achievement]"`  
* `"founded by [Indian name]"`  
* `"[Discovery] controversy / scandal"`  
* `"[Topic] named after"`

---

### **🏛️ History & Etymology**

**Sites:** Wikipedia, Merriam-Webster, OED, Etymology Online, Mental Floss, Smithsonian

**Search keyword patterns:**

* `"origin of the word [term]"`  
* `"first recorded use of [term]"`  
* `"eponym [word]"`  
* `"neologism [year]"`  
* `"[Event] today in history"`  
* `"[Country] connection [historical figure]"`

---

### **🏏 Sports**

**Sites:** ESPN Cricinfo, Wikipedia, BBC Sport, Reddit (`r/cricket`, `r/soccer`)

**Search keyword patterns:**

* `"[Player/Event] record broken"`  
* `"first Indian to [achievement]"`  
* `"[Sport] origin story"`  
* `"[Tournament] controversy"`  
* `"[Player] inspired by"`

---

### **🇮🇳 India Connection (All Categories)**

For any international news item, run a parallel search:

* `"[Person/Event/Topic] India connection"`  
* `"[Person/Event/Topic] Indian origin"`  
* `"[Person] born in India"`  
* `"[Topic] India link"`

**Priority sources:** The Hindu, Scroll, The Print, Reddit India, Wikipedia

---

## **─── UI / VISUAL DESIGN SPEC ─────────────────────────────────**

### **Aesthetic Direction**

* **Vibe:** Editorial magazine meets digital-native curiosity engine. Think *Wired* meets *Mental Floss* meets a premium trivia app.  
* **Theme:** Dark background with rich accent colours (amber, electric blue, or coral) — premium, readable, high contrast  
* **Typography:** Bold display font for headlines (e.g. Playfair Display, Syne, or DM Serif Display). Clean mono or sans for body.  
* **Layout:** Card-based grid. Each card \= one story/fact. Cards have a **Signal Badge** (e.g. 🎲 Surprise, 🥇 Novelty) visible at a glance.  
* **Motion:** Staggered card load animation. Hover state lifts cards with subtle glow. Time window toggle has smooth transition.

### **Per-Card Info Architecture**

Each card must display:

1. **Signal badge** (which interestingness signal triggered it)  
2. **Category tag** (Science, History, Movies, etc.)  
3. **Headline** (compelling, written in "did you know" voice)  
4. **Hook sentence** (1–2 lines of the most interesting part)  
5. **Source link** (clickable)  
6. **Time stamp** (relative: "3 days ago", "2 weeks ago")

### **Top-Level Controls**

* **Time window toggle** — Week / Month / Quarter / Year (pill tabs)  
* **Category filter** — All / Movies / Science / History / Sports / etc. (horizontal scroll chips)  
* **Signal filter** (optional) — Filter by Surprise / Novelty / India Connection / etc.

---

## **─── SCORING LOGIC (FOR AI/BACKEND) ─────────────────────────**

When evaluating a story, score it 0–3 on each signal:

| Signal | 0 | 1 | 2 | 3 |
| ----- | ----- | ----- | ----- | ----- |
| Surprise | Expected | Mildly unexpected | Contradicts assumption | Completely counterintuitive |
| Novelty | Nothing new | Minor first | Clear record/first | World/national first |
| Emotion | Neutral | Mild reaction | Strong reaction | Visceral / universal |
| Shareability | No impulse | Maybe | Likely | Instant "you have to hear this" |
| India Connection | None | Loose | Clear link | Totally unexpected |

**Threshold:** A story must score **≥ 2 on at least one signal**, or **≥ 1 on three or more signals**, to be displayed.

---

## **─── WHAT THIS IS NOT ────────────────────────────────────────**

* ❌ Not a breaking news ticker  
* ❌ Not a political news aggregator  
* ❌ Not a headline digest  
* ✅ It IS a curated "interesting facts from recent events" engine  
* ✅ Every item should make the reader think: *"I did NOT know that"*

---

## **─── REDDIT PRIORITY NOTE ────────────────────────────────────**

`r/todayilearned` is a **gold-standard source** for this tool. Stories that have already been upvoted on TIL have passed a community interestingness test. Prioritise sourcing from this subreddit wherever possible.

Other high-value subreddits:

* `r/interestingasfuck`  
* `r/mildlyinteresting` (sparingly)  
* `r/india` (for India Connection signal)  
* `r/bollywood`, `r/cricket`  
* `r/history`, `r/science`

# V2 \- Claude prompt 

# **IWTK — Category Criteria & Keyword Master List**

For each category: what makes a fact interesting \+ where to find it \+ what to search for. Modelled on the Movies framework. Use these as prompts, search queries, and source filters.

---

## **🎬 1\. ENTERTAINMENT — Bollywood & Hollywood (Non-Movie Specific)**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Origin** | How a celebrity got their break / was discovered / almost wasn't cast |
| **Alter ego / Real name** | Stage names, name changes, hidden identities |
| **Rivalries & feuds** | Behind-the-scenes fallouts that shaped careers or projects |
| **Unexpected collaborations** | Two stars working together that nobody expected |
| **Crossover** | Bollywood actor in Hollywood, or vice versa |
| **India connection** | International celebrity with Indian roots, training, or influence |
| **Inspiration** | A song, album, or show inspired by a real event or person |
| **Records** | Fastest album to X, highest-paid, most-streamed ever |
| **Controversies** | Plagiarism, ghostwriting, lip-sync scandals |
| **Legacy** | A show/song that changed something in culture permanently |
| **Cameos** | Unexpected appearances in each other's work |
| **Casting almost-was** | Famous roles that almost went to someone else |

### **Sites**

Wikipedia, IMDB, Reddit (`r/bollywood`, `r/todayilearned`, `r/interestingasfuck`), Filmfare archives, Variety, Rolling Stone, Genius (lyrics annotations)

### **Search Keyword Patterns**

* `"[Celebrity] real name"`  
* `"[Celebrity] almost cast in"`  
* `"[Song/Album] inspired by"`  
* `"[Show] based on true story"`  
* `"[Celebrity] Indian connection"`  
* `"[Celebrity] discovered by"`  
* `"things you didn't know about [Celebrity]"`  
* `"[Show/Album] controversy"`  
* `"[Celebrity] cameo in"`  
* `"[Song] plagiarism accusation"`  
* `"[Celebrity] record broken"`  
* `"[Show] cancelled because"`  
* `"[Film/Show] originally cast"`  
* `"[Actress/Actor] first film"`  
* `"[Award show] scandal"`  
* `"Bollywood inspired by Hollywood"`  
* `"[Indian film] remake of"`

---

## **🎵 2\. MUSIC**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Song origin** | What real event, person, or emotion inspired the song |
| **Hidden meaning** | Lyrics that mean something different from what people think |
| **Samples** | Famous songs built on a sample nobody knew about |
| **Record broken** | Fastest to X streams, longest at \#1, youngest artist to |
| **Ghostwriting** | A famous song actually written by someone else |
| **India connection** | Western song sampling Indian classical / Bollywood |
| **Banned / Censored** | Songs banned by governments or platforms |
| **One-take / accident** | Famous recordings made by accident or in one take |
| **Title story** | Why the song has that specific title |
| **Feuds** | Songs written as a direct response to another artist |
| **Legacy** | A song that changed the music industry |
| **Etymology** | A music term's origin (e.g. where did "jazz" come from?) |

### **Sites**

Wikipedia, Genius, Rolling Stone, Reddit (`r/todayilearned`, `r/Music`, `r/hiphopheads`), Pitchfork, NME

### **Search Keyword Patterns**

* `"[Song] inspired by"`  
* `"[Song] written about"`  
* `"[Song] sample origin"`  
* `"[Artist] ghostwritten by"`  
* `"[Song] banned in"`  
* `"[Song] hidden meaning"`  
* `"[Artist] record first"`  
* `"[Song] one take recording"`  
* `"[Artist] India connection"`  
* `"[Song] plagiarism lawsuit"`  
* `"[Genre] origin history"`  
* `"[Instrument] invented by"`  
* `"things you didn't know about [Song/Album]"`

---

## **🔬 3\. SCIENCE & SPACE**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Discovery origin** | How the discovery was made — especially if accidental |
| **Named after** | Who or what something is named after, and why |
| **India connection** | Indian scientist behind a global discovery; named after an Indian |
| **Counterintuitive** | A scientific fact that contradicts what most people believe |
| **Record** | Largest, smallest, hottest, coldest, fastest ever measured |
| **First** | First time something was observed, measured, or achieved in space |
| **Controversy** | Credit disputes, stolen discoveries, suppressed findings |
| **Origin story of a concept** | Where did a fundamental idea (gravity, DNA, atom) actually come from |
| **Animal inspiration** | Scientific breakthrough inspired by an animal's biology |
| **Failed experiment that worked** | Discoveries that came from accidents or failures |
| **Today in science history** | A significant science date |
| **India's first** | First Indian in space, first Indian satellite, etc. |

### **Sites**

Wikipedia, NASA, Nature, New Scientist, Science.org, BBC Science, Reddit (`r/todayilearned`, `r/science`, `r/space`), ISRO

### **Search Keyword Patterns**

* `"[Discovery] discovered by accident"`  
* `"[Concept] named after"`  
* `"[Scientific term] origin"`  
* `"[Discovery] Indian scientist"`  
* `"India's first [space/science achievement]"`  
* `"[Discovery] credit dispute"`  
* `"[Element/Planet] named after"`  
* `"World's first [scientific phenomenon]"`  
* `"[Animal] inspired [invention/discovery]"`  
* `"[Scientist] forgotten / overlooked"`  
* `"things you didn't know about [Topic]"`  
* `"[Discovery] controversy"`  
* `"[Space mission] failed but"`  
* `"[Country] first to discover"`  
* `"[Topic] debunked"`  
* `"myth vs fact [scientific topic]"`

---

## **🏛️ 4\. HISTORY & "TODAY IN HISTORY"**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Historical coincidence** | Two unrelated events that happened on the same date |
| **Counterfactual** | How one small decision changed everything |
| **Forgotten figure** | The person who actually did something, not the famous one |
| **India connection** | An international historical event with an Indian link |
| **Origin story** | Where a modern institution, tradition, or law actually came from |
| **Myth-buster** | A famous historical "fact" that is actually wrong |
| **Today in history** | Significant event on today's date |
| **Named after** | Something everyone uses, named after a real person (eponyms) |
| **First / Last** | First time something happened in human history |
| **Parallel** | A modern event that mirrors something from history exactly |
| **Hidden history** | Something deliberately erased or forgotten from textbooks |
| **Odd laws / customs** | Strange historical rules that once existed |

### **Sites**

Wikipedia, Britannica, History.com, Smithsonian, Reddit (`r/todayilearned`, `r/history`, `r/AskHistorians`), The Hindu Archives, India Today Archives

### **Search Keyword Patterns**

* `"[Date] today in history"`  
* `"[Event] historical coincidence"`  
* `"[Historical figure] forgotten"`  
* `"[Event] India connection"`  
* `"[Modern thing] origin history"`  
* `"[Famous fact] debunked"`  
* `"[Historical figure] named after"`  
* `"first time in history [phenomenon]"`  
* `"[Country] hidden history"`  
* `"[Event] parallel to today"`  
* `"[Common belief] myth history"`  
* `"[Indian figure] overlooked history"`  
* `"[Law / tradition] origin"`  
* `"[Historical event] untold story"`  
* `"what really happened [event]"`

---

## **🐾 5\. ANIMALS & NATURE**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Counterintuitive biology** | Animals that do something you'd never expect |
| **Extreme records** | Loudest, fastest, oldest, deadliest, strangest |
| **India connection** | Animal species discovered in India, or iconic to India |
| **Human-animal story** | Extraordinary bond or interaction between humans and animals |
| **New species discovered** | Recently identified species, especially in India |
| **Named after** | Species named after famous people (including Indians) |
| **Conservation story** | An animal that came back from the brink |
| **Animal inspiration** | Technology or medicine inspired by animal biology |
| **Myth-buster** | Common animal "facts" that are wrong |
| **Origin of animal names** | Why we call them what we call them |
| **Strange behaviour** | Animals doing things that seem almost human |
| **Extinction story** | An animal we lost, and the story behind it |

### **Sites**

Wikipedia, National Geographic, BBC Earth, WWF India, Wildlife Institute of India, Reddit (`r/todayilearned`, `r/natureismetal`, `r/aww`, `r/animals`)

### **Search Keyword Patterns**

* `"[Animal] can actually"`  
* `"[Animal] world record"`  
* `"[Animal] named after"`  
* `"new species discovered India [year]"`  
* `"[Animal] inspired invention"`  
* `"[Animal] myth debunked"`  
* `"[Animal] almost extinct"`  
* `"[Animal] India connection"`  
* `"[Animal] strangest behaviour"`  
* `"[Animal] origin of name"`  
* `"oldest living [animal]"`  
* `"[Animal] human rescue story"`  
* `"things you didn't know about [Animal]"`  
* `"[Animal] endangered comeback"`  
* `"[Insect/Plant] medicinal use discovered"`

---

## **🤖 6\. TECHNOLOGY & AI**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Origin story** | How a now-ubiquitous technology was actually invented |
| **Accidental invention** | Tech that was discovered by mistake |
| **Named after** | Products, formats, or technologies named after people/places |
| **India connection** | Indian inventor or institution behind a global technology |
| **India's first** | First Indian app, chip, satellite, AI model |
| **Abandoned / forgotten tech** | Technology that existed but was killed |
| **Record** | Fastest processor, largest model, most users ever |
| **Controversy** | Patent disputes, stolen credit, Big Tech scandals |
| **AI milestone** | First time AI did something considered "impossible" |
| **Unintended consequence** | A technology built for X that changed Y entirely |
| **Etymology** | Where tech terms come from (bluetooth, pixel, bug, spam) |
| **Prediction that came true** | Old sci-fi or forecast that turned out to be accurate |

### **Sites**

Wikipedia, Wired, MIT Technology Review, TechCrunch, Reddit (`r/todayilearned`, `r/technology`, `r/artificial`), IEEE Spectrum

### **Search Keyword Patterns**

* `"[Technology] invented by accident"`  
* `"[Tech term] origin of word"`  
* `"[Technology] named after"`  
* `"[Product] original purpose"`  
* `"[Tech] Indian inventor"`  
* `"India's first [technology]"`  
* `"[Company] founded by Indian"`  
* `"[Technology] killed by [company]"`  
* `"[AI milestone] first ever"`  
* `"[Tech giant] controversy scandal"`  
* `"[Invention] patent dispute"`  
* `"[Technology] unintended consequence"`  
* `"things you didn't know about [Tech]"`  
* `"[Sci-fi prediction] came true"`  
* `"[Tech product] origin story"`  
* `"[Famous tech] almost didn't exist"`

---

## **🌍 7\. GEOGRAPHY & WORLD RECORDS**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Counterintuitive geography** | Facts that contradict mental maps (e.g. which city is further north) |
| **Name origin** | Where a country, city, or place name actually comes from |
| **India connection** | A global geographical record held by an Indian place |
| **Border stories** | Strange borders, enclaves, disputed territories |
| **Record** | Largest, smallest, highest, deepest, hottest, oldest |
| **Only place in the world** | Something that only exists in one specific location |
| **Hidden geography** | Places that most people don't know exist |
| **Changed over time** | Countries that used to exist, borders that moved |
| **Named after** | Places named after people, animals, or events |
| **India's geography superlatives** | India's highest, largest, first, only |
| **Unusual country facts** | Strange laws, customs, or facts about a nation |
| **Natural wonder explanation** | The science behind a stunning natural phenomenon |

### **Sites**

Wikipedia, Britannica, Reddit (`r/todayilearned`, `r/geography`, `r/MapPorn`), Guinness World Records, National Geographic, Survey of India

### **Search Keyword Patterns**

* `"[Country/City] name origin"`  
* `"[Place] named after"`  
* `"[Country] world record"`  
* `"India's largest / highest / only [geographic feature]"`  
* `"[Geographic fact] counterintuitive"`  
* `"only place in the world [phenomenon]"`  
* `"[Country] strange law"`  
* `"[Border] disputed territory story"`  
* `"[Country] used to be called"`  
* `"[Country] enclave exclave"`  
* `"[Natural wonder] how it formed"`  
* `"[City] geography myth debunked"`  
* `"[Region] India connection"`  
* `"things you didn't know about [Country]"`  
* `"[Geographic record] broken"`

---

## **🏥 8\. HEALTH & BODY**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Counterintuitive health fact** | Something we do daily that has a surprising effect |
| **Body record** | Extreme human biological achievements |
| **Myth-buster** | Common health advice that is actually wrong |
| **India connection** | Ayurvedic origin of a practice now mainstream globally |
| **Discovery origin** | How a major medical breakthrough was actually found |
| **Named after** | Diseases, syndromes, or procedures named after people |
| **Accidental cure** | A treatment discovered by mistake |
| **Ancient vs. modern** | A modern practice with ancient origins |
| **Strange condition** | Rare medical conditions that sound fictional |
| **Psychology quirk** | Cognitive biases or mental phenomena most people experience |
| **Placebo / nocebo** | Cases where belief literally changed physical outcomes |
| **Drug origin story** | Where a common medicine actually came from |

### **Sites**

Wikipedia, WebMD, PubMed, NHS, Reddit (`r/todayilearned`, `r/medicine`, `r/psychology`), The Lancet, WHO

### **Search Keyword Patterns**

* `"[Health belief] myth debunked"`  
* `"[Disease] named after"`  
* `"[Drug] discovered by accident"`  
* `"[Medical procedure] origin"`  
* `"[Health practice] Indian origin"`  
* `"Ayurveda origin [modern practice]"`  
* `"[Common activity] surprising health effect"`  
* `"[Body part / function] counterintuitive fact"`  
* `"World record human body"`  
* `"[Condition] rarest in the world"`  
* `"[Psychological phenomenon] explained"`  
* `"[Common medicine] originally used for"`  
* `"things you didn't know about [body system]"`  
* `"[Disease] origin story"`  
* `"placebo real effect [study]"`  
* `"[Health advice] proven wrong"`

---

## **🏏 9\. SPORTS & ACHIEVEMENTS**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Record broken** | Any world, national, or tournament record — especially unexpected |
| **Origin story** | How a sport, tournament, or tradition actually started |
| **India connection** | An international sporting record with an Indian link |
| **India's first** | First Indian to achieve something in sport |
| **Forgotten champion** | An overlooked Indian sporting hero |
| **Rivalry backstory** | The real story behind a famous rivalry |
| **Rule origin** | Why a sport has a strange or counterintuitive rule |
| **Almost moment** | Famous near-misses or almost-champions |
| **Controversy** | Match-fixing, doping, eligibility scandals |
| **Crossover** | Athletes from different sports competing or collaborating |
| **Named after** | Trophies, stadiums, tournaments named after people |
| **Physics / science of sport** | The counterintuitive science behind a famous move |
| **Non-obvious champion** | A country or person dominating a sport you'd never expect |

### **Sites**

ESPN Cricinfo, Wikipedia, BBC Sport, Olympic.org, Reddit (`r/cricket`, `r/soccer`, `r/sports`, `r/todayilearned`), Wisden, Sports Illustrated India

### **Search Keyword Patterns**

* `"[Sport] origin history"`  
* `"[Rule] why does [sport] have"`  
* `"[Tournament] named after"`  
* `"[Player] world record"`  
* `"first Indian to [achievement]"`  
* `"India [sport] forgotten champion"`  
* `"[Sport] India connection"`  
* `"[Match] controversy scandal"`  
* `"[Player] rivalry backstory"`  
* `"[Country] surprising sport world champion"`  
* `"[Sport] almost moment"`  
* `"[Player] inspired by"`  
* `"[Trophy/Stadium] named after"`  
* `"things you didn't know about [Sport/Tournament]"`  
* `"[Sport] physics science behind"`  
* `"[Sporting achievement] doping controversy"`  
* `"cricket records first"`

---

## **💥 10\. CONTROVERSIES, VIRAL NEWS & SCANDALS**

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **The twist** | A viral story where the real truth was different from the viral narrative |
| **Unlikely villain / hero** | Someone cast as one who turned out to be the other |
| **India connection** | An international scandal with an unexpected Indian link |
| **Origin of the controversy** | How a minor incident escalated into a global story |
| **Corporate scandal** | A business behaving badly in a surprising way |
| **Cover-up revealed** | A conspiracy that turned out to be true |
| **Cancelled then vindicated** | Someone cancelled who was later proved right or innocent |
| **The forgotten one** | The person or detail in a scandal that everyone forgot |
| **Parallel controversy** | A current scandal that mirrors a historical one |
| **Institutional failure** | A system that was supposed to catch something and didn't |
| **The aftermath** | Where are they now — the surprising post-scandal story |
| **Whistleblower story** | The person who exposed something, and what happened to them |

### **Sites**

Wikipedia, The Guardian, Scroll, The Wire, Reddit (`r/todayilearned`, `r/OutOfTheLoop`, `r/worldnews`, `r/india`), BBC Investigations, The Print

### **Search Keyword Patterns**

* `"[Scandal] real truth"`  
* `"[Viral story] debunked"`  
* `"[Controversy] India connection"`  
* `"[Corporation] scandal exposed"`  
* `"[Scandal] whistleblower"`  
* `"[Person] cancelled but innocent"`  
* `"[Event] cover-up revealed"`  
* `"[Scandal] forgotten detail"`  
* `"[Controversy] origin how it started"`  
* `"[Person] vindicated after"`  
* `"[Scandal] parallel in history"`  
* `"[Viral news] what really happened"`  
* `"[Corporate scandal] India link"`  
* `"[Controversy] aftermath where are they now"`  
* `"[Scandal] suppressed investigation"`

---

## **🗣️ 11\. WORD ORIGINS & ETYMOLOGY (Cross-Category Signal)**

This is a signal that applies across ALL categories. Always run etymology checks when a keyword, term, or name is at the centre of a story.

### **What Makes It Interesting**

| Area | What to Look For |
| ----- | ----- |
| **Everyday words with surprising origins** | Words used daily with dark, funny, or unexpected histories |
| **India-origin words in English** | English words that came from Hindi, Sanskrit, Tamil, etc. |
| **Eponyms** | Words named after real people (often unflattering) |
| **Neologisms** | New words recently added to dictionaries |
| **Word that changed meaning** | A word that used to mean the opposite |
| **Brand names that became verbs** | Hoover, Google, Photoshop |
| **Tech term origins** | Bluetooth, pixel, bug, spam, podcast |
| **Sports term origins** | Love in tennis, hat-trick, googly |
| **Medical term origins** | Named after doctors or patients |
| **Slang that went mainstream** | Internet slang that entered formal language |

### **Sites**

Merriam-Webster, OED (Oxford English Dictionary), Etymonline.com, Mental Floss, Wikipedia, Reddit (`r/todayilearned`, `r/etymology`)

### **Search Keyword Patterns**

* `"origin of the word [term]"`  
* `"etymology [word]"`  
* `"[Word] used to mean"`  
* `"English words from Hindi / Sanskrit / Tamil"`  
* `"[Word] eponym named after"`  
* `"[Word] first recorded use"`  
* `"new word added to dictionary [year]"`  
* `"[Brand name] became a verb"`  
* `"[Sports term] etymology"`  
* `"[Medical term] named after"`  
* `"[Word] India origin"`  
* `"[Slang] entered Oxford dictionary"`

---

## **🇮🇳 12\. INDIA CONNECTION SIGNAL (Universal Overlay)**

Run this check against ANY international story. The India Connection signal can be applied to facts from any category above.

### **What Makes It Interesting**

* An international figure with Indian ancestry or origin  
* A global trend, word, or phenomenon that traces back to India  
* A record broken by an Indian in an unexpected domain  
* An international institution, law, or movement founded or shaped by an Indian  
* A global brand, product, or organisation that has Indian roots

### **Universal Search Patterns (apply to any topic)**

* `"[Person/Event/Topic] India connection"`  
* `"[Person] born in India"`  
* `"[Person] Indian origin"`  
* `"[Topic] Indian roots"`  
* `"[Product/Organisation] founded by Indian"`  
* `"[Global record] held by India"`  
* `"[Topic] named after Indian"`  
* `"[Country] Indian diaspora connection"`  
* `"[International event] Indian link"`  
* `"[Foreign word] from Sanskrit / Hindi"`

### **High-Value India Connection Sources**

* Wikipedia (check "Early life" and "Personal life" sections)  
* The Hindu, Scroll, The Print, India Today  
* Reddit `r/india`, `r/incredibleindia`  
* `r/todayilearned` filtered for India  
* PIB (Press Information Bureau) for government firsts

---

## **📋 MASTER KEYWORD TEMPLATES (Use Across All Categories)**

These templates work universally. Swap `[X]` for any subject:

| Template | Use Case |
| ----- | ----- |
| `"things you didn't know about [X]"` | General interestingness sweep |
| `"[X] origin story"` | How something began |
| `"[X] named after"` | Eponyms and name origins |
| `"[X] India connection"` | Universal India link check |
| `"[X] inspired by"` | Creative or scientific inspirations |
| `"[X] debunked / myth"` | Myth-busters |
| `"[X] world record / first"` | Novelty and superlatives |
| `"[X] controversy / scandal"` | Controversy signal |
| `"[X] forgotten / overlooked"` | Hidden history |
| `"[X] almost was / nearly"` | Near-miss stories |
| `"[X] accidentally invented / discovered"` | Accident origin stories |
| `Reddit r/todayilearned [X]"` | Community-validated interestingness |

