# PaperFetcher

A full-stack web application that automatically fetches and recommends research papers daily from academic sources based on user-selected domains.

## Features

- **User Authentication** — Register/login with JWT-based sessions and bcrypt password hashing
- **Multi-Source Paper Fetching** — Semantic Scholar, arXiv, and PubMed/Europe PMC with automatic fallback
- **Domain Selection** — Choose from native taxonomies or curated preset domains, plus custom free-text domains
- **Daily Scheduling** — Auto-fetch papers at a configurable time via APScheduler
- **Paper Dashboard** — Card-based UI with filters, sorting, pagination, bookmarks, and read tracking
- **PDF Viewing** — In-app PDF viewer for open-access papers with download support
- **Paywall Awareness** — Flags paywalled papers; only shows PDF options for open-access content
- **Deduplication** — Never shows the same paper twice to the same user

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite, APScheduler
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Auth**: JWT + bcrypt

## Quick Start

### Backend

```bash
cd backend
poetry install
poetry run fastapi dev app/main.py
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Configuration

Backend configuration via `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `paperfetcher-secret-key-change-in-production` | JWT signing key |
| `PAPER_SOURCES` | `semantic_scholar,arxiv,pubmed` | Comma-separated source priority |
| `SEMANTIC_SCHOLAR_BASE_URL` | `https://api.semanticscholar.org/graph/v1` | Semantic Scholar API base |
| `ARXIV_BASE_URL` | `https://export.arxiv.org/api` | arXiv API base (change for mirrors) |
| `PUBMED_BASE_URL` | `https://www.ebi.ac.uk/europepmc/webservices/rest` | Europe PMC API base |
| `DAILY_FETCH_HOUR` | `8` | Daily fetch hour (server time) |
| `DAILY_FETCH_MINUTE` | `0` | Daily fetch minute |
| `MAX_PAPERS_PER_DOMAIN` | `20` | Max papers fetched per domain per refresh |

Frontend configuration via `frontend/.env`:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/papers` | User's paper feed (auth required) |
| POST | `/api/refresh` | On-demand fetch for current user |
| GET | `/api/domains` | Available preset domains |
| GET | `/api/settings` | User's saved domain preferences |
| POST | `/api/settings` | Update user's domain preferences |
| POST | `/api/papers/:id/bookmark` | Toggle bookmark |
| POST | `/api/papers/:id/read` | Toggle read status |

## Architecture

```
backend/
  app/
    main.py          # FastAPI app entry point
    config.py         # Settings via pydantic-settings
    database.py       # SQLAlchemy async engine
    scheduler.py      # APScheduler daily fetch
    models/           # SQLAlchemy models
    routers/          # API route handlers
    services/         # Business logic (auth, paper fetching)
    sources/          # Paper source clients (Semantic Scholar, arXiv, PubMed)
frontend/
  src/
    App.tsx           # Main app with auth routing
    context/          # React context (auth state)
    pages/            # Login, DomainSelector, Dashboard
    components/       # PaperCard, PdfViewer
    lib/              # API client
    types/            # TypeScript type definitions
```
