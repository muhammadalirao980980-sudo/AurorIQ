# AurorIQ Brand System — v6.0 Repositioning
Source of truth for all copy, naming, and design decisions from Phase 3 onward.

---

## 1. Positioning

**Old:** A free adaptive IQ test.
**New:** **AurorIQ — The Intelligence Platform.** Precision instruments for measuring, understanding, and improving how you think.

**Positioning statement (internal):**
For curious, self-directed people who want honest insight into their own minds, AurorIQ is the intelligence platform that measures cognition with real psychometrics instead of flattery — because every instrument is adaptive, transparent about its methodology, and free with no email wall.

**One-line answer to "What is AurorIQ?":**
> AurorIQ is a platform of free, science-grounded instruments that measure how you think — intelligence, memory, learning style, personality, focus — and turn the results into something you can act on.

## 2. Brand architecture

Masterbrand → five categories → tools. The masterbrand carries trust; categories carry search intent; tools carry conversion.

| Category | Working name | Voice angle |
|---|---|---|
| Intelligence | **Cognition** | "Measure the shape of your mind" (flagship line lives here) |
| Career | **Career** | "Point your mind at the right problems" |
| Learning | **Learning** | "Learn the way your brain actually works" |
| Psychology | **Psychology** | "Understand the machinery behind the mind" |
| Productivity | **Productivity** | "Turn insight into output" |

Naming convention for tools: plain, intent-matching nouns (`Memory Test`, `Learning Style Assessment`) — never invented brand names per tool. The archetype/tier lexicon (Radiant, The Architect, etc.) remains exclusive to *results*, not tool names.

## 3. Messaging hierarchy

**Platform headline (homepage H1):**
> Instruments for the curious mind.

**Platform subheadline:**
> AurorIQ is a platform of adaptive, science-grounded assessments — intelligence, memory, personality, learning, focus. Real percentiles, transparent methods, honest results. No email. No flattery.

Rationale: "Instruments" (not "tests/quizzes") is the load-bearing word — it signals precision and separates AurorIQ from BuzzFeed-tier quiz sites. "No email. No flattery." is retained verbatim; it is the most differentiated line in the current brand and now scales to the whole platform.

**Retained lines (do not discard):**
- "Measure the shape of your mind." → becomes the IQ Test / Cognition category hero.
- "An adaptive cognitive assessment that maps how you think" → IQ test meta description root.

**CTA language:** Primary = "Start the assessment" / "Begin" (verb-first, tool-specific). Secondary = "See how it works" / "Explore the platform". Never "Find out your IQ now!" — urgency-bait violates the voice.

## 4. Voice principles

1. **Honest over impressive.** State limits plainly (screening ≠ diagnosis, estimate ≠ clinical score). This is the moat.
2. **Precise over hyped.** Numbers get context (percentile, confidence). No "unlock your genius."
3. **Calm over urgent.** No countdowns, no scarcity, no exclamation marks in UI copy.
4. **Second person, active voice, short sentences.** Em-dashes allowed; ellipses are not.
5. **Scientific grounding without overclaiming.** Cite constructs (IRT, OCEAN, working memory) — never claim clinical validity.

## 5. Trust & credibility framework

Every tool page must carry, in order: (a) what it measures, (b) how it measures it (method, item count, duration), (c) what the result does and does not mean, (d) a plain-language disclaimer. Psychology-category screeners (ADHD, autism, stress, burnout) additionally require: "This is a screening instrument, not a diagnosis. A positive screen means a conversation with a clinician is worth having — nothing more, nothing less." This is both an ethical requirement and the strongest possible E-E-A-T signal in this niche.

## 6. Visual identity direction (implemented in Phase 3)

Deep navy foundation, electric blue primary, cyan accent, emerald success, amber warning, neutral grayscale. Purple demoted to a supporting accent — retained only in the aurora gradient (brand signature) and select tier/domain colors where it aids differentiation. Motion: subtle, purposeful, `prefers-reduced-motion` respected everywhere (already the codebase standard).

## 7. What explicitly does not change

- Domain, logo mark, name "AurorIQ"
- robots.txt, netlify.toml, consent architecture, ads.txt
- The archetype/tier result system and its lexicon
- Free, no-account, no-email model
- Static, framework-free architecture
