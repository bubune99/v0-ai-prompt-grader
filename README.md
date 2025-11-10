# AI Prompt Grader

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/e-creatives/v0-ai-prompt-grader)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/tpqFA7OLZWD)

## Overview

An interactive AI-powered prompt evaluation tool that helps users craft better prompts by providing detailed feedback, scoring, and improvements using Claude (Anthropic). The application features a two-stage workshop format with dynamic criteria evaluation and sustainability metrics tracking.

## Features

- **Two-Stage Prompt Workshop**: Guided prompt improvement process
- **Dynamic Criteria Evaluation**: Flexible scoring system based on configurable criteria
- **AI-Powered Feedback**: Detailed analysis and improvement suggestions using Claude Sonnet 4
- **Sustainability Tracking**: Monitor token usage, CO2 emissions, and cost estimates
- **Session Management**: Create and manage multiple workshop sessions
- **User Feedback Collection**: Gather ratings and feedback from participants

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI**: Anthropic Claude Sonnet 4 (via Vercel AI SDK)
- **Database**: Neon PostgreSQL (with JSONB for dynamic criteria)
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- Neon PostgreSQL database ([Get one here](https://console.neon.tech/))

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/v0-ai-prompt-grader.git
   cd v0-ai-prompt-grader
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

   Edit `.env.local` and add your credentials:
   \`\`\`env
   ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
   NEON_DATABASE_URL=postgresql://user:pass@host.region.aws.neon.tech/dbname?sslmode=require
   \`\`\`

4. **Initialize the database**
   \`\`\`bash
   npm run dev
   \`\`\`

   Then visit these endpoints to set up your database:
   - [http://localhost:3000/api/init-db](http://localhost:3000/api/init-db) - Creates tables and seeds default session
   - [http://localhost:3000/api/migrate](http://localhost:3000/api/migrate) - Runs schema migrations
   - [http://localhost:3000/api/health](http://localhost:3000/api/health) - Verifies setup

5. **Start using the application**

   Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Database Management

- **POST /api/init-db** - Initialize database tables and seed default session
- **POST /api/migrate** - Run database migrations (adds dynamic criteria support)
- **POST /api/reset-db** - Reset database (development only)
- **GET /api/health** - Check database connectivity and schema status

### Application APIs

- **POST /api/evaluate** - Evaluate a prompt using AI
- **GET /api/sessions/active** - Get current active session
- **GET /api/sessions** - List all sessions
- **POST /api/goal** - Create/update session goals
- **GET /api/submissions** - Get all submissions for analytics
- **POST /api/feedback** - Submit user feedback
- **POST /api/rate-evaluation** - Rate an AI evaluation

## Database Schema

### Dynamic Criteria System

The application supports dynamic evaluation criteria stored as JSONB:

**Sessions Table**
\`\`\`sql
stage1_criteria JSONB  -- Array of {name, description} objects
stage2_criteria JSONB  -- Array of {name, description} objects
\`\`\`

**Submissions Table**
\`\`\`sql
criteria_scores JSONB  -- Object mapping criterion names to scores (0-100)
\`\`\`

This allows flexible criteria per session without schema changes.

## Development

### Running Migrations

If you've made database schema changes:

\`\`\`bash
# Via API
curl -X POST http://localhost:3000/api/migrate

# Or run SQL directly
psql $NEON_DATABASE_URL < scripts/003_add_dynamic_criteria.sql
\`\`\`

### Health Check

Monitor your application health:

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

Returns:
- Database connectivity status
- Table counts
- Schema migration status
- Environment variable checks

### Database Reset (Development)

To start fresh in development:

\`\`\`bash
curl -X POST http://localhost:3000/api/reset-db
\`\`\`

**⚠️ Warning**: This drops all tables and data!

## Security Notes

### Important: Regenerate Exposed Credentials

If you cloned this repository, you MUST regenerate:

1. **Anthropic API Key**: Visit [Anthropic Console](https://console.anthropic.com/) → Settings → API Keys → Create New Key
2. **Neon Database**: Visit [Neon Console](https://console.neon.tech/) → Your Project → Reset Password or Create New Database

The `.env.example` file contains placeholders only. Never commit actual credentials to `.env.local`.

## Deployment

Your project is deployed at:

**[https://vercel.com/e-creatives/v0-ai-prompt-grader](https://vercel.com/e-creatives/v0-ai-prompt-grader)**

### Environment Variables on Vercel

Ensure these are set in Vercel project settings:
- `ANTHROPIC_API_KEY`
- `NEON_DATABASE_URL`

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Continue Building

**[Build on v0.app](https://v0.app/chat/tpqFA7OLZWD)**

## Troubleshooting

### "Invalid model name" error

If you see API errors about the model:
- The app uses `claude-sonnet-4-20250514`
- Check `app/api/evaluate/route.ts:87` has the correct model name

### Database connection issues

1. Check `/api/health` endpoint
2. Verify `NEON_DATABASE_URL` in `.env.local`
3. Ensure database URL includes `?sslmode=require`
4. Run `/api/init-db` to create tables

### No criteria showing in results

1. Run `/api/migrate` to add `criteria_scores` column
2. Check `/api/health` - `schema.migrationStatus` should be "migrated"
3. Verify session has criteria: `GET /api/sessions/active`

## License

MIT
