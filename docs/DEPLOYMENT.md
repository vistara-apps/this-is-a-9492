# RightsGuard AI - Deployment Guide

This guide covers deploying RightsGuard AI to production environments.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides excellent support for React/Vite applications with automatic deployments.

#### Setup Steps

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Environment Variables**
   
   Add these in Vercel dashboard under Settings > Environment Variables:
   
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OPENAI_API_KEY=sk-your-openai-key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
   VITE_APP_URL=https://your-domain.vercel.app
   ```

3. **Build Configuration**
   
   Vercel automatically detects Vite projects. No additional configuration needed.

4. **Custom Domain** (Optional)
   
   Add your custom domain in Vercel dashboard under Settings > Domains.

### Option 2: Netlify

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   
   Add in Netlify dashboard under Site settings > Environment variables.

### Option 3: Docker Deployment

#### Build Docker Image

```dockerfile
# Use the existing Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Serve with a simple HTTP server
RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Deploy to Cloud Platforms

**Google Cloud Run:**
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/rightsguard-ai

# Deploy to Cloud Run
gcloud run deploy rightsguard-ai \
  --image gcr.io/PROJECT-ID/rightsguard-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**AWS ECS:**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

docker build -t rightsguard-ai .
docker tag rightsguard-ai:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/rightsguard-ai:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/rightsguard-ai:latest
```

## 🔧 Production Configuration

### Environment Variables

Create production environment variables:

```env
# Supabase Production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key

# OpenAI Production
VITE_OPENAI_API_KEY=sk-your-production-key

# Stripe Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-production-key

# App Configuration
VITE_APP_URL=https://your-production-domain.com
```

### Supabase Production Setup

1. **Create Production Project**
   ```bash
   # Create new Supabase project for production
   # Copy database schema from database/schema.sql
   ```

2. **Configure Authentication**
   ```sql
   -- Set up auth providers
   -- Configure email templates
   -- Set up redirect URLs
   ```

3. **Set up Storage**
   ```sql
   -- Create storage buckets
   -- Configure storage policies
   -- Set up CORS for your domain
   ```

4. **Database Optimization**
   ```sql
   -- Add indexes for performance
   CREATE INDEX CONCURRENTLY idx_incident_reports_user_created 
   ON incident_reports(user_id, created_at DESC);
   
   CREATE INDEX CONCURRENTLY idx_users_subscription_status 
   ON users(subscription_status);
   ```

### Stripe Production Setup

1. **Activate Live Mode**
   - Complete Stripe account verification
   - Switch to live mode in dashboard
   - Update API keys in environment

2. **Configure Webhooks**
   ```javascript
   // Webhook endpoint: https://your-domain.com/api/stripe-webhook
   // Events to listen for:
   // - customer.subscription.created
   // - customer.subscription.updated
   // - customer.subscription.deleted
   // - invoice.payment_succeeded
   // - invoice.payment_failed
   ```

3. **Set up Products and Prices**
   ```bash
   # Create Pro subscription product
   stripe products create \
     --name "RightsGuard AI Pro" \
     --description "Unlimited AI scripts and advanced features"
   
   # Create monthly price
   stripe prices create \
     --product prod_XXXXXXXXXX \
     --unit-amount 300 \
     --currency usd \
     --recurring interval=month
   ```

### OpenAI Production Setup

1. **API Key Management**
   - Use production API keys
   - Set up usage monitoring
   - Configure rate limits

2. **Cost Optimization**
   ```javascript
   // Implement caching for similar requests
   const cacheKey = `scripts_${state}_${language}`
   const cached = await redis.get(cacheKey)
   if (cached) return JSON.parse(cached)
   
   // Cache results for 24 hours
   await redis.setex(cacheKey, 86400, JSON.stringify(result))
   ```

## 🔒 Security Configuration

### Content Security Policy

Add CSP headers to your deployment:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.openai.com https://*.supabase.co https://api.stripe.com;
  media-src 'self' blob: https://*.supabase.co;
">
```

### HTTPS Configuration

Ensure HTTPS is enabled:

```javascript
// Redirect HTTP to HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`)
}
```

### CORS Configuration

Configure CORS in Supabase:

```sql
-- Add your production domain to allowed origins
INSERT INTO storage.cors (bucket_id, allowed_origins, allowed_methods)
VALUES (
  'incident-recordings',
  ARRAY['https://your-domain.com'],
  ARRAY['GET', 'POST', 'PUT', 'DELETE']
);
```

## 📊 Monitoring and Analytics

### Error Tracking

Set up error tracking with Sentry:

```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
})
```

### Performance Monitoring

1. **Web Vitals**
   ```javascript
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
   
   getCLS(console.log)
   getFID(console.log)
   getFCP(console.log)
   getLCP(console.log)
   getTTFB(console.log)
   ```

2. **Supabase Analytics**
   - Monitor database performance
   - Track API usage
   - Set up alerts for errors

3. **Stripe Analytics**
   - Monitor subscription metrics
   - Track payment failures
   - Set up revenue alerts

### Logging

Implement structured logging:

```javascript
// src/lib/logger.js
export const logger = {
  info: (message, data) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString()
    }))
  },
  error: (message, error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }))
  }
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
        VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
        VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🔄 Database Migrations

### Migration Strategy

1. **Schema Changes**
   ```sql
   -- Always use transactions for schema changes
   BEGIN;
   
   -- Add new columns with defaults
   ALTER TABLE users ADD COLUMN new_field VARCHAR(255) DEFAULT 'default_value';
   
   -- Create indexes concurrently
   CREATE INDEX CONCURRENTLY idx_new_field ON users(new_field);
   
   COMMIT;
   ```

2. **Data Migrations**
   ```sql
   -- Migrate data in batches
   UPDATE users 
   SET new_field = 'migrated_value' 
   WHERE id IN (
     SELECT id FROM users 
     WHERE new_field = 'default_value' 
     LIMIT 1000
   );
   ```

### Backup Strategy

1. **Automated Backups**
   ```bash
   # Set up daily backups
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   
   # Upload to cloud storage
   aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
   ```

2. **Point-in-Time Recovery**
   - Enable WAL archiving in Supabase
   - Set up automated backup retention
   - Test recovery procedures regularly

## 📱 Mobile Optimization

### Progressive Web App (PWA)

1. **Service Worker**
   ```javascript
   // public/sw.js
   const CACHE_NAME = 'rightsguard-v1'
   const urlsToCache = [
     '/',
     '/static/js/bundle.js',
     '/static/css/main.css'
   ]
   
   self.addEventListener('install', event => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then(cache => cache.addAll(urlsToCache))
     )
   })
   ```

2. **Web App Manifest**
   ```json
   {
     "name": "RightsGuard AI",
     "short_name": "RightsGuard",
     "description": "Your pocket legal advisor",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#3B82F6",
     "background_color": "#FFFFFF",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       }
     ]
   }
   ```

## 🧪 Production Testing

### Health Checks

```javascript
// src/api/health.js
export async function healthCheck() {
  const checks = {
    database: false,
    storage: false,
    openai: false,
    stripe: false
  }
  
  try {
    // Test database connection
    const { data } = await supabase.from('users').select('count').limit(1)
    checks.database = !!data
    
    // Test storage access
    const { data: buckets } = await supabase.storage.listBuckets()
    checks.storage = !!buckets
    
    // Test OpenAI (optional)
    // checks.openai = await testOpenAI()
    
    // Test Stripe (optional)
    // checks.stripe = await testStripe()
    
  } catch (error) {
    console.error('Health check failed:', error)
  }
  
  return checks
}
```

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test configuration
# artillery.yml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Browse rights information"
    flow:
      - get:
          url: "/"
      - think: 5
      - get:
          url: "/api/legal-content/California"

# Run load test
artillery run artillery.yml
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variable Issues**
   ```bash
   # Check environment variables are loaded
   console.log('Environment check:', {
     supabase: !!import.meta.env.VITE_SUPABASE_URL,
     openai: !!import.meta.env.VITE_OPENAI_API_KEY,
     stripe: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
   })
   ```

3. **CORS Issues**
   ```javascript
   // Add proper CORS headers
   // Check Supabase CORS configuration
   // Verify domain whitelist
   ```

### Performance Issues

1. **Bundle Size Optimization**
   ```bash
   # Analyze bundle size
   npm run build
   npx vite-bundle-analyzer dist
   
   # Implement code splitting
   const LazyComponent = lazy(() => import('./Component'))
   ```

2. **Database Performance**
   ```sql
   -- Add missing indexes
   EXPLAIN ANALYZE SELECT * FROM incident_reports WHERE user_id = 'uuid';
   
   -- Optimize queries
   CREATE INDEX idx_incident_reports_user_created 
   ON incident_reports(user_id, created_at DESC);
   ```

---

This deployment guide covers all aspects of taking RightsGuard AI from development to production. Follow the security best practices and monitoring recommendations to ensure a robust deployment.
