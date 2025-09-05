# RightsGuard AI - API Documentation

This document outlines the complete API integrations and data flow for RightsGuard AI.

## 🏗 Architecture Overview

RightsGuard AI uses a modern serverless architecture with the following components:

- **Frontend**: React SPA with Vite
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Services**: OpenAI GPT-3.5 Turbo
- **Payments**: Stripe

## 🔐 Authentication Flow

### Supabase Authentication

```javascript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
})

// Sign Out
const { error } = await supabase.auth.signOut()
```

### User Profile Management

```javascript
// Create user profile after signup
const userProfile = await userService.createUser({
  id: user.id,
  email: user.email
})

// Get user profile
const profile = await userService.getUser(userId)

// Update user profile
const updated = await userService.updateUser(userId, {
  subscription_status: 'pro'
})
```

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_status VARCHAR(20) DEFAULT 'free',
    script_generations_used INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Incident Reports Table

```sql
CREATE TABLE incident_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location TEXT,
    state VARCHAR(50),
    notes TEXT,
    audio_url TEXT,
    video_url TEXT,
    share_card_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Legal Content Table

```sql
CREATE TABLE legal_content (
    content_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(50) NOT NULL,
    rights_info TEXT NOT NULL,
    script_to_say TEXT,
    script_not_to_say TEXT,
    language VARCHAR(20) DEFAULT 'english',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(state, language)
);
```

## 🤖 OpenAI Integration

### Script Generation

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a legal expert who provides accurate, state-specific advice for civil rights during police encounters."
    },
    {
      role: "user",
      content: `Generate specific, actionable scripts for someone in ${state} during a police encounter.`
    }
  ],
  max_tokens: 800,
  temperature: 0.3
})
```

### Translation Service

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a professional translator specializing in legal terminology."
    },
    {
      role: "user",
      content: `Translate this legal text to Spanish: ${text}`
    }
  ],
  max_tokens: 500,
  temperature: 0.1
})
```

## 💳 Stripe Integration

### Subscription Management

```javascript
// Create checkout session
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId,
    priceId: 'price_pro_monthly',
    successUrl: `${window.location.origin}/subscription-success`,
    cancelUrl: `${window.location.origin}/subscription-cancelled`
  })
})

// Create customer portal session
const response = await fetch('/api/create-portal-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerId,
    returnUrl: window.location.origin
  })
})
```

### Webhook Handling

```javascript
// Handle subscription events
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Update user subscription status
      break
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break
  }

  res.json({received: true})
})
```

## 📁 File Storage

### Upload Files to Supabase Storage

```javascript
const uploadFile = async (file, bucket = 'incident-recordings', folder = 'recordings') => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath
  }
}
```

### Delete Files

```javascript
const deleteFile = async (filePath, bucket = 'incident-recordings') => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) throw error
  return true
}
```

## 🔒 Row Level Security Policies

### Users Table Policies

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
```

### Incident Reports Policies

```sql
-- Users can view own incidents
CREATE POLICY "Users can view own incidents" ON incident_reports
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create own incidents
CREATE POLICY "Users can create own incidents" ON incident_reports
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update own incidents
CREATE POLICY "Users can update own incidents" ON incident_reports
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete own incidents
CREATE POLICY "Users can delete own incidents" ON incident_reports
    FOR DELETE USING (auth.uid()::text = user_id::text);
```

### Storage Policies

```sql
-- Users can upload their own recordings
CREATE POLICY "Users can upload their own recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'incident-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own recordings
CREATE POLICY "Users can view their own recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'incident-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 📱 Client-Side API Usage

### User Service

```javascript
import { userService } from '../lib/database.js'

// Create user
const user = await userService.createUser({
  id: 'user-uuid',
  email: 'user@example.com'
})

// Get user
const user = await userService.getUser('user-uuid')

// Update user
const updated = await userService.updateUser('user-uuid', {
  subscription_status: 'pro'
})

// Increment script usage
const updated = await userService.incrementScriptUsage('user-uuid')
```

### Incident Service

```javascript
import { incidentService } from '../lib/database.js'

// Create incident
const incident = await incidentService.createIncident({
  userId: 'user-uuid',
  location: 'California',
  state: 'California',
  notes: 'Traffic stop incident',
  audioUrl: 'https://storage.url/audio.webm'
})

// Get user incidents
const incidents = await incidentService.getUserIncidents('user-uuid')

// Delete incident
await incidentService.deleteIncident('incident-uuid', 'user-uuid')
```

### Legal Content Service

```javascript
import { legalContentService } from '../lib/database.js'

// Get legal content
const content = await legalContentService.getLegalContent('California', 'english')

// Save legal content (admin only)
const saved = await legalContentService.saveLegalContent({
  state: 'California',
  rightsInfo: 'Your rights in California...',
  scriptToSay: 'What to say...',
  scriptNotToSay: 'What not to say...',
  language: 'english'
})
```

## 🔄 Data Flow

### Script Generation Flow

1. User selects state and clicks "Generate Scripts"
2. Check user authentication and subscription limits
3. Call OpenAI API with state-specific prompt
4. Parse and validate AI response
5. Update legal content in database
6. Increment user's script generation count
7. Display scripts to user

### Recording Flow

1. User starts audio/video recording
2. Browser captures media stream
3. User stops recording
4. Create blob from recorded chunks
5. Upload blob to Supabase storage
6. Create incident report with file URL
7. Save incident to database
8. Display success message

### Subscription Flow

1. User clicks upgrade to Pro
2. Create Stripe checkout session
3. Redirect to Stripe payment page
4. User completes payment
5. Stripe webhook updates subscription status
6. Update user profile in database
7. Refresh user interface

## 🚨 Error Handling

### API Error Responses

```javascript
// Standard error response format
{
  error: {
    code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
    message: 'Free users limited to 3 script generations per month',
    details: {
      current_usage: 3,
      limit: 3,
      reset_date: '2024-02-01T00:00:00Z'
    }
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED`: User must be authenticated
- `SUBSCRIPTION_LIMIT_EXCEEDED`: Free tier limit reached
- `INVALID_STATE`: Invalid US state provided
- `UPLOAD_FAILED`: File upload error
- `AI_SERVICE_UNAVAILABLE`: OpenAI API error
- `PAYMENT_FAILED`: Stripe payment error

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
VITE_OPENAI_API_KEY=sk-your-openai-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key

# App
VITE_APP_URL=https://your-domain.com
```

### Production Considerations

- Use environment-specific Supabase projects
- Implement proper CORS policies
- Set up Stripe webhooks with proper endpoints
- Use production OpenAI API keys with proper rate limits
- Implement proper logging and monitoring
- Set up backup and disaster recovery

## 📊 Rate Limits and Quotas

### OpenAI API Limits

- Free tier: 3 requests per month per user
- Pro tier: Unlimited requests (subject to OpenAI rate limits)
- Implement exponential backoff for rate limit errors

### Supabase Limits

- Database: Based on plan (Free: 500MB, Pro: 8GB+)
- Storage: Based on plan (Free: 1GB, Pro: 100GB+)
- Auth: Based on plan (Free: 50,000 MAU, Pro: 100,000 MAU+)

### File Upload Limits

- Max file size: 100MB per recording
- Supported formats: WebM (audio/video)
- Automatic cleanup of files older than 1 year

## 🧪 Testing

### API Testing

```javascript
// Test user creation
describe('User Service', () => {
  test('should create user profile', async () => {
    const user = await userService.createUser({
      id: 'test-user',
      email: 'test@example.com'
    })
    expect(user.email).toBe('test@example.com')
    expect(user.subscription_status).toBe('free')
  })
})

// Test script generation
describe('OpenAI Service', () => {
  test('should generate legal scripts', async () => {
    const scripts = await generateLegalScripts('California', 'english')
    expect(scripts.scriptToSay).toBeTruthy()
    expect(scripts.scriptNotToSay).toBeTruthy()
  })
})
```

### Integration Testing

- Test complete user flows end-to-end
- Verify database constraints and RLS policies
- Test file upload and deletion
- Verify subscription upgrade and downgrade flows
- Test error handling and fallback mechanisms

---

This API documentation provides a comprehensive overview of all integrations and data flows in RightsGuard AI. For implementation details, refer to the source code in `/src/lib/`.
