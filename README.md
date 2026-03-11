# Peter's Lab Blog Writer

Peter's Lab Blog Writer is a guided editorial MVP for PetersLab.

The product flow is:

1. `Trend Scan`
2. `Idea Discovery`
3. `Writing in Progress`
4. `Review & Edit`
5. `Completed`

It is designed as a step-by-step wizard for beginners, not a long dashboard. The UI language and result language are separated, and the final review step shows only the selected result language in one editable document.

## Requirements

- Node.js 18 or later
- A local `.env` file
- `OPENAI_API_KEY` for trend scan and draft generation
- `NOTION_API_KEY` and `NOTION_PARENT_PAGE_ID` if you want final-step upload to Notion

## Environment Variables

Create a local `.env` file in the project root.

Use `.env.example` as the template:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
NOTION_API_KEY=
NOTION_PARENT_PAGE_ID=
NOTION_VERSION=2026-03-11
PORT=4173
```

Rules:

- Do not commit `.env`
- Do not hardcode real keys in source files
- Do not paste real keys into documentation or screenshots

## Run Locally

Start the local server:

```powershell
.\run-local.ps1
```

Or run Node directly:

```powershell
node server.js
```

Open:

`http://localhost:4173`

## What Works in This MVP

- Live Japan-focused pet trend scan through OpenAI web search
- Trend selection that moves directly into idea setup
- Keyword suggestion plus manual keyword entry
- Three title suggestions
- Direction choice for the article tone
- Writing progress step with staged status messages
- Final review step with one-language-only full document editing
- Plain-language compliance notes
- Final-step copy to clipboard
- Final-step Notion upload

## Main Files

- `server.js`: local HTTP server, OpenAI calls, Notion upload endpoint
- `index.html`: wizard-style multi-step UI shell
- `app.js`: front-end state, rendering, step transitions, and actions
- `styles.css`: PetersLab-aligned visual system based on the logo color direction
- `run-local.ps1`: local start script
