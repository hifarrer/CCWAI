# Cron Job Setup for RSS News Ingestion

This document explains how to set up a cron job using [cron-job.org](http://cron-job.org/) to automatically ingest RSS feeds for cancer-related news.

## Prerequisites

1. Your application must be deployed and accessible via a public URL
2. You need to set up the `CRON_SECRET_TOKEN` environment variable

## Environment Variable Setup

Add the following to your `.env` file (or environment variables in your hosting platform):

```bash
CRON_SECRET_TOKEN=your-secure-random-token-here
```

**Important:** Generate a strong, random token. You can use:
- A UUID: `uuidgen` (on Mac/Linux) or online UUID generator
- A random string: `openssl rand -hex 32`
- Or any secure random string generator

Example:
```bash
CRON_SECRET_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## Setting Up the Cron Job on cron-job.org

1. **Sign up/Login** to [cron-job.org](http://cron-job.org/)

2. **Create a New Job:**
   - Click "Create cronjob" or "Add cronjob"
   - Fill in the job details:

3. **Job Configuration:**
   - **Title:** RSS News Ingestion (or any name you prefer)
   - **Address (URL):** `https://your-domain.com/api/cron/ingest-news?token=YOUR_CRON_SECRET_TOKEN`
     - Replace `your-domain.com` with your actual domain
     - Replace `YOUR_CRON_SECRET_TOKEN` with the token you set in your environment variable
   - **Schedule:** 
     - Recommended: Every 6 hours (`0 */6 * * *`)
     - Or every 4 hours: `0 */4 * * *`
     - Or daily at 2 AM: `0 2 * * *`
   - **Request Method:** GET or POST (both work)
   - **Timeout:** 300 seconds (5 minutes) - RSS parsing can take time

4. **Optional Settings:**
   - **Status notifications:** Enable to get notified if the job fails
   - **Test run:** Click "Test run" to verify the endpoint works

5. **Save the cron job**

## Alternative: Using Authorization Header

If you prefer to use the Authorization header instead of a query parameter:

1. In cron-job.org, when creating the job:
   - **Address (URL):** `https://your-domain.com/api/cron/ingest-news`
   - **Request Method:** POST
   - **Headers:** Add a custom header:
     - **Name:** `Authorization`
     - **Value:** `Bearer YOUR_CRON_SECRET_TOKEN`

## API Endpoint Details

**Endpoint:** `/api/cron/ingest-news`

**Methods:** GET or POST

**Authentication:**
- Option 1: Query parameter: `?token=YOUR_CRON_SECRET_TOKEN`
- Option 2: Authorization header: `Authorization: Bearer YOUR_CRON_SECRET_TOKEN`

**Response:**
```json
{
  "success": true,
  "ingested": 5,
  "errors": 0,
  "duration": "1234ms",
  "timestamp": "2025-01-XX...",
  "message": "Successfully processed RSS feeds. Ingested 5 new articles."
}
```

## How It Works

1. The cron job calls the endpoint at the scheduled time
2. The endpoint validates the secret token
3. It fetches all active RSS feeds from the database
4. For each feed, it:
   - Parses the RSS feed
   - Filters for cancer-related articles (using keyword detection)
   - Saves new articles to the `NewsArticle` table
   - Skips articles that already exist (by URL)
5. Returns a summary of how many articles were ingested

## Cancer-Related Filtering

The ingestion function only saves articles that are cancer-related. It checks for:
- Specific cancer types (breast, lung, prostate, etc.)
- General cancer keywords (cancer, tumor, oncology, chemotherapy, etc.)
- Treatment-related terms (immunotherapy, radiation therapy, etc.)

## Troubleshooting

### Error: "Unauthorized - Invalid token"
- Verify that `CRON_SECRET_TOKEN` is set in your environment variables
- Check that the token in the cron job URL matches the environment variable
- Make sure there are no extra spaces or characters

### Error: "Cron job authentication not configured"
- The `CRON_SECRET_TOKEN` environment variable is not set
- Add it to your `.env` file or hosting platform's environment variables

### No articles being ingested
- Check that you have active RSS feeds in the admin dashboard (`/admin`)
- Verify the RSS feed URLs are valid and accessible
- Check the cron job execution logs on cron-job.org
- Review server logs for any errors during ingestion

### Timeout errors
- Increase the timeout in cron-job.org settings
- Some RSS feeds may be slow to respond
- Consider processing fewer items per feed if needed

## Monitoring

- Check cron-job.org dashboard for execution history
- Review server logs for ingestion results
- Monitor the admin dashboard to see new articles appearing
- Check the `DataIngestionLog` table in your database for detailed logs

## Recommended Schedule

- **Every 6 hours:** Good balance between freshness and server load
- **Every 4 hours:** More frequent updates
- **Daily:** Less server load, but news may be less fresh
- **Every 12 hours:** Conservative approach

Choose based on your server capacity and how fresh you want the news to be.

