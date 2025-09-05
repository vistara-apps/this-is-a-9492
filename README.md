# RightsGuard AI

Your pocket legal advisor for instant clarity during police encounters.

## 🚀 Overview

RightsGuard AI is a mobile-first web application that provides on-demand, state-specific legal information and communication scripts for stressful encounters with law enforcement. The app allows users to capture incident details and generates AI-powered guidance tailored to their location.

## ✨ Features

### Core Features
- **State-Specific Rights & Scripts**: Location-based legal guidance with AI-generated communication scripts
- **Quick Record & Document**: Audio/video recording with secure cloud storage
- **Shareable Incident Cards**: Generate and share incident summaries with trusted contacts
- **Mobile-Optimized Content**: Clean, accessible interface designed for high-stress situations

### Subscription Features
- **Free Tier**: Basic rights information, 3 AI script generations per month, basic recording
- **Pro Tier ($3/month)**: Unlimited AI scripts, advanced recording, offline access, priority support

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI**: OpenAI GPT-3.5 Turbo for script generation
- **Payments**: Stripe for subscription management
- **Deployment**: Docker-ready with Vite build

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd rightsguard-ai
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database schema:

```sql
-- Copy and paste the contents of database/schema.sql into your Supabase SQL editor
```

3. Set up Row Level Security policies (included in schema.sql)
4. Create the storage bucket for incident recordings

### 4. Stripe Setup

1. Create a Stripe account
2. Set up a product with a $3/month recurring price
3. Copy the price ID to your environment variables
4. Configure webhooks for subscription events (optional for demo)

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

## 🏗 Architecture

### Data Model

```
User
├── userId (UUID)
├── email (string)
├── subscriptionStatus (free|pro)
├── scriptGenerationsUsed (number)
└── lastResetDate (timestamp)

IncidentReport
├── reportId (UUID)
├── userId (UUID, foreign key)
├── timestamp (timestamp)
├── location (string)
├── state (string)
├── notes (text)
├── audioUrl (string, optional)
├── videoUrl (string, optional)
└── shareCardContent (JSON)

LegalContent
├── contentId (UUID)
├── state (string)
├── rightsInfo (text)
├── scriptToSay (text)
├── scriptNotToSay (text)
└── language (english|spanish)
```

### Key Components

- **AuthContext**: Manages user authentication with Supabase
- **SubscriptionContext**: Handles subscription status and usage tracking
- **RightsCard**: Main interface for viewing rights and generating scripts
- **LocationSelector**: State selection with geolocation support
- **IncidentHistory**: View and manage recorded incidents
- **SubscriptionModal**: Upgrade flow with Stripe integration

## 🔧 Configuration

### Tailwind CSS

The app uses a custom design system with CSS variables:

```css
:root {
  --color-primary: hsl(225, 80%, 55%);
  --color-accent: hsl(30, 90%, 60%);
  --color-bg-default: hsl(220, 20%, 98%);
  --color-surface-default: hsl(0, 0%, 100%);
}
```

### OpenAI Integration

Scripts are generated using GPT-3.5 Turbo with state-specific prompts:

```javascript
const prompt = `You are a legal expert specializing in civil rights during police encounters. 
Generate specific, actionable scripts for someone in ${state} during a police encounter.`
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build the Docker image
docker build -t rightsguard-ai .

# Run the container
docker run -p 3000:3000 rightsguard-ai
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment:

- Use production Supabase URLs
- Use production Stripe keys
- Set proper CORS origins
- Configure proper redirect URLs

## 🔒 Security Considerations

### Row Level Security (RLS)
- All database tables have RLS enabled
- Users can only access their own data
- Legal content is readable by authenticated users only

### API Keys
- OpenAI API calls should go through your backend in production
- Never expose secret keys in client-side code
- Use environment variables for all sensitive configuration

### File Uploads
- All recordings are stored in private Supabase storage buckets
- Files are organized by user ID for proper access control
- Automatic cleanup of orphaned files

## 📱 Mobile Optimization

The app is designed mobile-first with:

- Touch-friendly interface elements
- Responsive design for all screen sizes
- Optimized for high-stress situations
- Quick access to critical features
- Offline capability for Pro users (future enhancement)

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] State selection and rights display
- [ ] AI script generation (with API key)
- [ ] Audio/video recording functionality
- [ ] Incident history management
- [ ] Subscription upgrade flow
- [ ] Mobile responsiveness
- [ ] Error handling and fallbacks

### Demo Mode

The app includes comprehensive fallbacks for demo purposes:

- Mock authentication when Supabase is not configured
- Mock AI responses when OpenAI is not configured
- Mock payment flow when Stripe is not configured
- LocalStorage fallbacks for all data operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in `/docs`
- Review the database schema in `/database/schema.sql`
- Examine the API integrations in `/src/lib/`

## 🔮 Future Enhancements

- [ ] Offline mode for Pro users
- [ ] Push notifications for incident reminders
- [ ] Integration with legal aid organizations
- [ ] Multi-language support expansion
- [ ] Advanced analytics and reporting
- [ ] Emergency contact integration
- [ ] Geofencing for automatic state detection

---

Built with ❤️ for civil rights and digital safety.
