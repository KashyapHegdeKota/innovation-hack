# Innovation Hacks: Production-Ready Monorepo Template

A hackathon-optimized monorepo featuring **Next.js** (Frontend), **FastAPI** (Backend), **Supabase** (Database), and **Firebase Auth** (Authentication).

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Firebase Project
- Supabase Project

### 2. Environment Setup

#### Frontend (`apps/web`)
Create `apps/web/.env` based on `apps/web/.env.example`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (`apps/api`)
Create `apps/api/.env` based on `apps/api/.env.example`:
```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
FIREBASE_SERVICE_ACCOUNT_JSON=firebase-service-account.json
```
**Important:** Download your Firebase Service Account JSON from the Firebase Console (Project Settings > Service Accounts) and place it in `apps/api/firebase-service-account.json`.

### 3. Installation & Running

#### Start Backend
```bash
cd apps/api
pip install -r requirements.txt
python main.py
```

#### Start Frontend
```bash
cd apps/web
npm install
npm run dev
```

## 🏗️ Architecture

- **Auth Flow:** Next.js uses Firebase Client SDK for login. A JWT is retrieved and sent in the `Authorization: Bearer` header.
- **Backend Security:** FastAPI verifies the JWT using the Firebase Admin SDK. The user's `uid` is injected into protected routes.
- **Database:** Supabase is accessed via the Python client using the `SERVICE_ROLE_KEY`. All queries are filtered by `author_id` (Firebase UID) to ensure data isolation.

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Axios, Lucide React
- **Backend:** FastAPI, Firebase Admin SDK, Supabase Python Client
- **Database:** Supabase (PostgreSQL)
- **Auth:** Firebase Authentication (Google Sign-In)

## 📄 Documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Branching strategy and commit rules.
