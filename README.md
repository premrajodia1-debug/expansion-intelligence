# Expansion Intelligence — Version 2

A student-built international market-entry decision-support prototype. It combines an illustrative baseline dashboard with an optional server-side AI qualitative assessment.

## Features
- Scenario inputs (company/product, home market, target market, budget, industry)
- Illustrative market opportunity and risk scores (preset assumptions; not verified statistics)
- Entry route, risk prompts, and 90-day plan
- Optional AI assessment via the OpenAI Responses API

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
3. Set the environment variable in your shell (the sample `.env` is documentation only; this starter does not automatically load dotenv files):
   - macOS/Linux: `export OPENAI_API_KEY="your_key"`
4. Optional: `export OPENAI_MODEL="model-name-you-have-access-to"`
5. Run `npm start` and open `http://localhost:3000`.

The API key stays on the server and is not placed in browser code. Do not commit secrets or your `.env` file.


## Limitations
- The score dashboard uses preset illustrative indicators, not current market data.
- AI output is qualitative and may be wrong; it does not conduct live research or verify claims.
- Validate any business decision with current sources, local expertise, and financial analysis.

## Project story
This prototype explores how a structured interface can help turn a broad international expansion question into a repeatable decision workflow. It was built with AI-assisted coding, then extended with a server-side AI integration pattern.
