# Cron API Endpoint Usage Examples

This document provides practical examples of how to use the `/api/cron/ingest-news` endpoint.

## Prerequisites

1. Set the `CRON_SECRET_TOKEN` environment variable in your `.env` file:
   ```bash
   CRON_SECRET_TOKEN=my-secret-token-12345
   ```

2. Make sure you have active RSS feeds configured in the admin dashboard (`/admin`)

## Example 1: Using cURL with Query Parameter (Recommended for cron-job.org)

### Local Development
```bash
curl -X GET "http://localhost:3000/api/cron/ingest-news?token=my-secret-token-12345"
```

### Production
```bash
curl -X GET "https://your-domain.com/api/cron/ingest-news?token=my-secret-token-12345"
```

### With POST Method
```bash
curl -X POST "https://your-domain.com/api/cron/ingest-news?token=my-secret-token-12345"
```

## Example 2: Using cURL with Authorization Header

### Local Development
```bash
curl -X GET "http://localhost:3000/api/cron/ingest-news" \
  -H "Authorization: Bearer my-secret-token-12345"
```

### Production
```bash
curl -X GET "https://your-domain.com/api/cron/ingest-news" \
  -H "Authorization: Bearer my-secret-token-12345"
```

### With POST Method
```bash
curl -X POST "https://your-domain.com/api/cron/ingest-news" \
  -H "Authorization: Bearer my-secret-token-12345"
```

## Example 3: Using JavaScript/Node.js (fetch)

```javascript
// Using query parameter
const response = await fetch(
  'https://your-domain.com/api/cron/ingest-news?token=my-secret-token-12345',
  {
    method: 'GET', // or 'POST'
  }
);

const data = await response.json();
console.log(data);
```

```javascript
// Using Authorization header
const response = await fetch(
  'https://your-domain.com/api/cron/ingest-news',
  {
    method: 'GET', // or 'POST'
    headers: {
      'Authorization': 'Bearer my-secret-token-12345'
    }
  }
);

const data = await response.json();
console.log(data);
```

## Example 4: Using Python (requests)

```python
import requests

# Using query parameter
url = "https://your-domain.com/api/cron/ingest-news"
params = {"token": "my-secret-token-12345"}
response = requests.get(url, params=params)
data = response.json()
print(data)
```

```python
import requests

# Using Authorization header
url = "https://your-domain.com/api/cron/ingest-news"
headers = {"Authorization": "Bearer my-secret-token-12345"}
response = requests.get(url, headers=headers)
data = response.json()
print(data)
```

## Example 5: Setting Up on cron-job.org

1. **Go to [cron-job.org](http://cron-job.org/) and create a new job**

2. **Configuration:**
   - **Title:** RSS News Ingestion
   - **Address (URL):** 
     ```
     https://your-domain.com/api/cron/ingest-news?token=my-secret-token-12345
     ```
   - **Schedule:** `0 */6 * * *` (every 6 hours)
   - **Request Method:** GET or POST
   - **Timeout:** 300 seconds

3. **Alternative (using headers):**
   - **Address (URL):** `https://your-domain.com/api/cron/ingest-news`
   - **Request Method:** POST
   - **Custom Headers:**
     - Name: `Authorization`
     - Value: `Bearer my-secret-token-12345`

## Expected Response

### Success Response (200 OK)
```json
{
  "success": true,
  "ingested": 5,
  "errors": 0,
  "duration": "2341ms",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "message": "Successfully processed RSS feeds. Ingested 5 new articles."
}
```

### Error Response - Unauthorized (401)
```json
{
  "error": "Unauthorized - Invalid token"
}
```

### Error Response - No Token Configured (500)
```json
{
  "error": "Cron job authentication not configured"
}
```

### Error Response - Server Error (500)
```json
{
  "success": false,
  "error": "Failed to ingest news",
  "message": "Error details here"
}
```

## Testing Locally

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the endpoint:**
   ```bash
   curl -X GET "http://localhost:3000/api/cron/ingest-news?token=my-secret-token-12345"
   ```

3. **Check the response:**
   ```json
   {
     "success": true,
     "ingested": 3,
     "errors": 0,
     "duration": "1234ms",
     "timestamp": "2025-01-15T10:30:00.000Z",
     "message": "Successfully processed RSS feeds. Ingested 3 new articles."
   }
   ```

## Testing in Production

1. **Make sure `CRON_SECRET_TOKEN` is set in your production environment**

2. **Test with curl:**
   ```bash
   curl -X GET "https://your-domain.com/api/cron/ingest-news?token=YOUR_PRODUCTION_TOKEN"
   ```

3. **Or use cron-job.org's "Test run" feature** to verify it works before scheduling

## Response Fields Explained

- **success** (boolean): Whether the ingestion completed successfully
- **ingested** (number): Number of new articles saved to the database
- **errors** (number): Number of errors encountered during processing
- **duration** (string): How long the ingestion took (in milliseconds)
- **timestamp** (string): ISO timestamp of when the ingestion completed
- **message** (string): Human-readable summary message

## Troubleshooting

### "Unauthorized - Invalid token"
- Check that the token in your request matches `CRON_SECRET_TOKEN` exactly
- Make sure there are no extra spaces or characters
- Verify the environment variable is set correctly

### "Cron job authentication not configured"
- The `CRON_SECRET_TOKEN` environment variable is not set
- Add it to your `.env` file or hosting platform's environment variables

### No articles ingested
- Check that you have active RSS feeds in the admin dashboard
- Verify the RSS feed URLs are valid and accessible
- Check server logs for any parsing errors

### Timeout errors
- Increase the timeout in cron-job.org settings (default: 300 seconds)
- Some RSS feeds may be slow to respond
- Consider processing fewer items per feed if needed

## Security Best Practices

1. **Use a strong, random token:**
   ```bash
   # Generate a secure token
   openssl rand -hex 32
   # or
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Never commit the token to version control:**
   - Keep it in `.env` file (which should be in `.gitignore`)
   - Use environment variables in your hosting platform

3. **Rotate tokens periodically:**
   - Update `CRON_SECRET_TOKEN` in your environment
   - Update the token in your cron job configuration

4. **Monitor access:**
   - Check server logs for unauthorized access attempts
   - Set up alerts for failed authentication attempts

