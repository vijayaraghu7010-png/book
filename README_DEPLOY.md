# E-Library Deploy Guide

## Hosting + backend

- Hosting: **GitHub Pages**
- Backend: **Supabase**

## What is included

- Shared cached assets:
  - `app.css`
  - `app-core.js`
  - `auth-core.js`
- Separate page wrappers:
  - `index.html`, `index.css`, `index.js`
  - `home.html`, `home.css`, `home.js`
  - `reader.html`, `reader.css`, `reader.js`
  - `profile.html`, `profile.css`, `profile.js`
- GitHub Pages workflow:
  - `.github/workflows/deploy-pages.yml`
- Supabase config:
  - `supabase-config.js`
- Supabase SQL setup:
  - `SUPABASE_SETUP.sql`

## How backend login works

This project now uses:
- a Supabase table for users
- backend Postgres functions for register/login
- SHA-256 password hashing in the browser before sending to Supabase

So users log in with:
- username
- password

without using the old email-confirmation flow.

## Supabase setup

1. Create a Supabase project
2. Open SQL Editor
3. Run `SUPABASE_SETUP.sql`
4. Open `supabase-config.js`
5. Paste your:
   - project URL
   - anon/publishable key
6. Set `enabled: true`

## GitHub Pages deploy

1. Create a GitHub repository
2. Upload all files from this folder
3. Push to the `main` branch
4. In GitHub:
   - open `Settings`
   - open `Pages`
   - set source to **GitHub Actions**
5. The workflow deploys automatically

## Notes

- Backend story sync uses the Supabase `stories` table
- Backend login uses the `library_users` table and RPC functions
- Username/password are also remembered locally in the browser because you requested auto-fill
