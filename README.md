# WORKNOON AI-Powered Customer Support Refund System

A full-stack AI-assisted customer support system for processing e-commerce refund requests.

## Features

- Customer refund request interface
- Synthetic CRM and order database
- Deterministic refund policy engine
- Gemini AI classification
- Prompt-injection protection
- Approved / Denied / Escalated decisions
- Human-review threshold for refunds above $500
- Audit logging
- Admin dashboard
- PostgreSQL + Prisma
- Docker support
- AI failure fallback and retry handling

## Architecture

Customer UI
    ↓
Next.js API
    ↓
Refund Service
    ├── PostgreSQL / Prisma
    ├── Policy Engine
    ├── Gemini AI Service
    └── Audit Logger
           ↓
      Admin Dashboard

## Policy

The current demonstration policy uses:

- Refund window: 30 days
- Final-sale items: ineligible
- Already refunded orders: denied
- Cancelled orders: denied
- Refund greater than order total: denied
- Refunds above $500: escalated for human review
- Suspicious or conflicting requests: escalated

## AI Safety

Customer-provided text is treated as untrusted data.

The AI cannot directly determine the final refund decision.

The deterministic backend policy engine remains authoritative.

Prompt-injection attempts are detected and can cause escalation.

AI responses are validated using Zod.

## AI Reliability

Gemini failures such as temporary 503 or rate-limit responses are retried using exponential backoff.

If AI remains unavailable, the backend falls back safely while allowing the deterministic policy engine to determine the final decision.

## AI AVAILABILITY

AI availability fallback: If the Gemini API is temporarily unavailable, the system retries transient failures and falls back to the deterministic policy engine. AI unavailability never overrides the backend's authoritative policy decision.
## Setup

### Requirements

- Node.js
- pnpm
- Docker
- Gemini API key

### Install

```bash
cd frontend
pnpm install
