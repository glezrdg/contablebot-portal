# ContableBot Portal

A Next.js SaaS application for Dominican Republic invoice management and accounting compliance (Form 606). Uses AI to extract data from invoice images and provides structured invoice management with export capabilities.

## Features

- 🤖 **AI-Powered Invoice Extraction** - Google Vision API extracts data from invoice images
- 📊 **Dominican 606 Format** - Structured invoice data for DR tax compliance
- 💾 **Cloud Storage** - Secure invoice management and organization
- 📥 **Export Capabilities** - Export to Excel (606 format) and CSV
- 🔐 **Multi-Tenant SaaS** - Firm-based data isolation with JWT authentication
- 💳 **Whop Integration** - Subscription management and payment processing

## Tech Stack

- **Frontend**: Next.js 16 (Pages Router), React 19, PrimeReact, Tailwind CSS
- **Backend**: Next.js API Routes, PostgREST (PostgreSQL)
- **Auth**: JWT with httpOnly cookies, bcrypt password hashing
- **Payment**: Whop platform integration
- **AI**: Google Vision API for invoice data extraction
- **Deployment**: Docker + Traefik (contablebot.hackstak.io)

## Quick Start

### Development Server

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file:

```env
POSTGREST_BASE_URL=http://localhost:8081
JWT_SECRET=your-jwt-secret-here
GOOGLE_VISION_API_KEY=your-google-vision-key
```

See [.env.example](.env.example) for reference.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
contablebot-portal/
├── pages/              # Next.js pages and API routes
│   ├── index.tsx      # Landing page
│   ├── login.tsx      # Authentication
│   ├── dashboard.tsx  # Main invoice management UI
│   └── api/           # Backend API routes
│
├── components/         # React components
│   ├── Header.tsx     # Navigation
│   ├── HeroSection.tsx
│   └── ...
│
├── lib/               # Utility functions
│   ├── auth.ts        # JWT authentication
│   └── whop.ts        # Whop integration
│
├── types/             # TypeScript type definitions
│   └── index.ts       # Main types (Firm, Invoice, etc.)
│
├── styles/            # Global CSS and Tailwind config
│   └── globals.css
│
├── directives/        # AI development SOPs (see below)
├── execution/         # Validation scripts (see below)
└── .tmp/             # Temporary files (gitignored)
```

## AI-Assisted Development

This project includes a **3-layer hybrid architecture** for AI-assisted development:

### 🎯 Quick Overview

- **Directives** (`directives/`) - SOPs for common development tasks
- **Execution Scripts** (`execution/`) - Python validation tools
- **Orchestration** - AI follows directives and uses scripts for validation

### 📚 Documentation

- **[SETUP_ARCHITECTURE.md](SETUP_ARCHITECTURE.md)** - Complete architecture guide
- **[CLAUDE.md](CLAUDE.md)** - Instructions for AI agents
- **[INSTALL_PYTHON.md](INSTALL_PYTHON.md)** - Python setup for execution scripts

### 🚀 Quick Setup for AI Development

```bash
# Install Python dependencies for validation scripts
setup-python.bat

# Or manually:
python -m venv venv
venv\Scripts\activate
pip install -r execution\requirements.txt
```

**Available directives:**
- `add_api_route.md` - Creating Next.js API routes
- `add_component.md` - Building React components
- `modify_types.md` - Updating TypeScript types

**Execution scripts:**
- `analyze_types.py` - Parse TypeScript type definitions
- `test_api.py` - Test API endpoints

See [SETUP_ARCHITECTURE.md](SETUP_ARCHITECTURE.md) for complete details.

## Key Features & Patterns

### Multi-Tenancy
All data is isolated by `firm_id`:
```typescript
const user = await requireAuth(req, res);
const firmId = user.firm_id;

// PostgREST query
?firm_id=eq.${firmId}
```

### Soft Delete
Records are soft-deleted, not removed:
```typescript
&is_deleted=eq.false
```

### Authentication
Protected routes use JWT middleware + `requireAuth`:
```typescript
import { requireAuth } from '@/lib/auth';

const user = await requireAuth(req, res);
if (!user) return; // 401 response sent
```

### Subscription Plans (Whop)
- **Starter** - $9/mo, 150 invoices
- **Business** - $19/mo, 500 invoices
- **Pro** - $39/mo, 1,500 invoices (Most Popular)
- **Ultra** - $69/mo, 3,000 invoices
- **Enterprise** - $99/mo, 6,000 invoices

## Design System

- **Theme**: Dark mode (slate-950 base)
- **Primary**: Sky blue (#0ea5e9)
- **Typography**: Geist font family
- **Components**: PrimeReact (customized in globals.css)
- **Responsive**: Mobile-first with Tailwind breakpoints

## Docker Deployment

```bash
# Build image
docker build -t contablebot-portal .

# Run with docker-compose
docker-compose -f docker-compose.portal.yml up -d
```

Configured with Traefik reverse proxy and Let's Encrypt SSL.

## Development Workflow

### Adding a New API Route

1. Check existing patterns in `pages/api/`
2. Create route file with authentication
3. Follow multi-tenancy patterns
4. Test with `python execution/test_api.py`

See [directives/add_api_route.md](directives/add_api_route.md) for complete guide.

### Creating a Component

1. Check design system patterns
2. Create component with TypeScript props
3. Apply Tailwind styling (dark theme)
4. Use PrimeReact components where applicable

See [directives/add_component.md](directives/add_component.md) for complete guide.

### Modifying Types

1. Analyze current types: `python execution/analyze_types.py`
2. Update `types/index.ts`
3. Update related code
4. Validate: `npm run build`

See [directives/modify_types.md](directives/modify_types.md) for complete guide.

## API Routes

**Authentication:**
- `POST /api/login` - Email/password authentication
- `POST /api/register` - User registration with Whop
- `GET /api/me` - Current user/firm info

**Invoices:**
- `GET /api/invoices` - Fetch invoices (with filters)
- `DELETE /api/invoices/[id]` - Soft delete invoice

**Clients:**
- `GET /api/clients` - Get unique clients for filtering

## Database Schema

**Main Tables:**
- `firms` - Organizations with Whop subscriptions
- `portal_users` - Login credentials
- `invoices` - Invoice records (606 format)
- `clients` - Client/vendor information

Backend: PostgREST API over PostgreSQL

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn-pages-router)
- [Next.js GitHub](https://github.com/vercel/next.js)

### Project-Specific Resources
- [Architecture Guide](SETUP_ARCHITECTURE.md) - 3-layer development system
- [AI Instructions](CLAUDE.md) - How AI agents work with this project
- [Type Definitions](types/index.ts) - Core data models

## Contributing

When contributing:
1. Follow existing patterns (see directives)
2. Maintain multi-tenancy and soft delete patterns
3. Use TypeScript for type safety
4. Test API changes with execution scripts
5. Follow the dark theme design system

## License

Private project - ContableBot Portal
