# Peter's Lab Blog Writer

Peter's Lab Blog Writer is a multi-step editorial MVP for PetersLab.

Flow:

1. `Trend Scan`
2. `Trend Loading`
3. `Idea Discovery`
4. `Blog Writing`
5. `Review & Edit`
6. `Completed`

The app is not a static site. It needs a server because OpenAI and Notion keys must stay on the server side.

## Security Model

- `OPENAI_API_KEY` is read only from server environment variables or local `.env`
- The browser never receives the raw API key
- `.env` is ignored by Git and must never be committed
- GitHub will not show your real key, by design

## Required Environment Variables

Use `.env.example` as the template.

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
NOTION_API_KEY=
NOTION_PARENT_PAGE_ID=
NOTION_VERSION=2026-03-11
PORT=4173
```

Minimum for web use:

- `OPENAI_API_KEY`

Optional:

- `NOTION_API_KEY`
- `NOTION_PARENT_PAGE_ID`

## Run Locally

```powershell
node server.js
```

Open:

`http://localhost:4173`

## Web Deployment

This repository is now deployment-ready for a server host.

Included files:

- `Dockerfile`
- `render.yaml`

### Option 1: Render

1. Connect this GitHub repo in Render.
2. Create a new Web Service from the repo, or use `render.yaml`.
3. Add environment variables in Render:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `NOTION_API_KEY` if needed later
   - `NOTION_PARENT_PAGE_ID` if needed later
4. Deploy.

Important:

- Do not put API keys into GitHub files.
- Put them only in Render environment variables.

### Option 2: Any Docker Host

Build:

```bash
docker build -t peterslab-blog-writer .
```

Run:

```bash
docker run -p 4173:4173 \
  -e OPENAI_API_KEY=your_key_here \
  -e OPENAI_MODEL=gpt-4.1-mini \
  peterslab-blog-writer
```

Important:

- Pass real keys through the host platform secret manager or environment settings.
- Do not hardcode secrets into source files.

## Main Files

- `server.js`: HTTP server, OpenAI calls, Notion upload endpoint, static file serving
- `app.js`: shared browser-side state and translation helpers
- `index.html`: step 1
- `trend-loading.html`: step 2
- `idea.html`: step 3
- `writing.html`: step 4
- `review.html`: step 5
- `completed.html`: step 6

## Current Status

- OpenAI-backed trend scan works through the server
- Multi-page workflow is enabled
- Final copy flow works
- Notion upload shape is ready
- Notion remains inactive until its environment variables are added
