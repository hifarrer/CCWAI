# Cancer Research Companion

A comprehensive web application that provides patients and caregivers with up-to-date cancer research information, clinical trial matching, AI-powered Q&A, and emotional support resources.

## Features

- **9 Core Widgets:**
  1. New Hope Finder - Latest research papers from PubMed
  2. Clinical Trials Near Me - Find potential clinical trials
  3. Latest News - Cancer research news from RSS feeds
  4. Ask the AI - AI-powered Q&A with contextual answers
  5. Alternative Medicine - Research on complementary treatments
  6. Treatment & Side Effects Library - Comprehensive treatment information
  7. My Cancer Type Overview - Personalized insights for your cancer type
  8. Emotional Support & Practical Help - Support resources directory
  9. Daily Check-In - Symptom tracking and history

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, PostgreSQL
- **Database:** Prisma ORM
- **Authentication:** NextAuth.js (Email + Google OAuth)
- **AI:** OpenAI GPT-4o for chat and summarization
- **Hosting:** Render

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials (for Google login)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CCWAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in all required values:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate a random secret
- `NEXTAUTH_URL` - Your app URL (e.g., `http://localhost:3000`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `OPENAI_API_KEY` - From OpenAI
- `CRON_SECRET_TOKEN` - Random secret token for cron job authentication (see CRON_SETUP.md)
- Email server configuration (for email auth)

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Ingestion

The application includes data ingestion services for:
- PubMed research papers (via Apify or direct API)
- ClinicalTrials.gov trials
- RSS news feeds (automated via cron job)

### Manual Ingestion (Admin Only)

To trigger data ingestion manually (requires admin authentication):

```bash
# Ingest papers
curl -X POST http://localhost:3000/api/admin/ingest/papers

# Ingest trials
curl -X POST http://localhost:3000/api/admin/ingest/trials

# Ingest news
curl -X POST http://localhost:3000/api/admin/ingest/news
```

### Automated RSS News Ingestion (Cron Job)

The RSS news ingestion can be automated using a cron job service like [cron-job.org](http://cron-job.org/).

**Public Endpoint:** `/api/cron/ingest-news`

This endpoint:
- Fetches all active RSS feeds from the database
- Filters for cancer-related articles only
- Saves new articles to the NewsArticle table
- Requires a secret token for authentication

**Setup Instructions:** See [CRON_SETUP.md](./CRON_SETUP.md) for detailed setup instructions.

**Quick Setup:**
1. Set `CRON_SECRET_TOKEN` in your environment variables
2. Create a cron job on cron-job.org pointing to:
   `https://your-domain.com/api/cron/ingest-news?token=YOUR_CRON_SECRET_TOKEN`
3. Schedule it to run every 6 hours (or your preferred interval)

## Deployment on Render

1. Create a new PostgreSQL database on Render
2. Create a new Web Service:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment: Node 18+
3. Set all environment variables in Render dashboard
4. Run database migrations on first deploy
5. Set up CRON jobs for data ingestion (daily schedule)

## Medical Disclaimers

⚠️ **IMPORTANT:** This application provides information for educational purposes only. It does not constitute medical advice. Always consult your healthcare provider for personalized medical guidance and before making any treatment decisions.

## License

[Your License Here]

## Support

For issues or questions, please open an issue in the repository.

