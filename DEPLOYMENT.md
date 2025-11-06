# Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
Ensure all environment variables are set in Render:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (generate a secure random string)
- `NEXTAUTH_URL` (your production URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_SERVER_HOST` (if using email auth)
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `OPENAI_API_KEY`
- `APIFY_API_TOKEN` (optional, for PubMed scraping)

### 2. Database Setup
1. Create PostgreSQL database on Render
2. Update `DATABASE_URL` in environment variables
3. Run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret to environment variables

### 4. Render Setup

#### Web Service
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** 18 or higher
- **Environment:** Node

#### Database
- Use Render PostgreSQL (or external PostgreSQL)
- Copy connection string to `DATABASE_URL`

#### Cron Jobs (Optional)
Set up scheduled jobs for data ingestion:
1. Create Cron Job for PubMed ingestion (daily at 2 AM UTC)
   - Command: `curl -X POST https://your-domain.com/api/admin/ingest/papers -H "Authorization: Bearer YOUR_SECRET_TOKEN"`
2. Create Cron Job for Clinical Trials (daily at 3 AM UTC)
   - Command: `curl -X POST https://your-domain.com/api/admin/ingest/trials -H "Authorization: Bearer YOUR_SECRET_TOKEN"`
3. Create Cron Job for News (every 6 hours)
   - Command: `curl -X POST https://your-domain.com/api/admin/ingest/news -H "Authorization: Bearer YOUR_SECRET_TOKEN"`

**Note:** Add authentication to admin endpoints in production!

## Post-Deployment

### 1. Initial Data Ingestion
Run the ingestion endpoints manually to populate initial data:
```bash
# Papers
curl -X POST https://your-domain.com/api/admin/ingest/papers

# Trials
curl -X POST https://your-domain.com/api/admin/ingest/trials

# News
curl -X POST https://your-domain.com/api/admin/ingest/news
```

### 2. Test Authentication
- Test email login
- Test Google OAuth
- Verify session persistence

### 3. Test Widgets
- Verify all 9 widgets load correctly
- Test filters and search functionality
- Test AI chat interface
- Test daily check-in and PDF export

### 4. Security Checklist
- [ ] Add rate limiting to API endpoints
- [ ] Secure admin endpoints with authentication
- [ ] Enable HTTPS
- [ ] Review CORS settings
- [ ] Add input validation/sanitization
- [ ] Review error messages (don't expose sensitive info)

### 5. Monitoring
- Set up error logging (Sentry, LogRocket, etc.)
- Monitor API response times
- Track OpenAI API usage
- Monitor database performance

## Production Considerations

### Performance
- Enable Next.js caching
- Implement database connection pooling
- Consider CDN for static assets
- Optimize images if adding any

### Scaling
- Database connection pooling (use PgBouncer or similar)
- Consider Redis for session storage (optional)
- Monitor OpenAI API rate limits
- Set up database backups

### Legal/Compliance
- Add Privacy Policy
- Add Terms of Service
- HIPAA considerations (if storing any PHI)
- GDPR compliance (if serving EU users)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Render
   - Verify firewall settings

2. **Authentication Not Working**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain
   - Verify OAuth callback URLs

3. **OpenAI API Errors**
   - Check API key is valid
   - Monitor rate limits
   - Verify billing/credits

4. **Widgets Not Loading Data**
   - Check data ingestion has run
   - Verify API endpoints are accessible
   - Check browser console for errors

