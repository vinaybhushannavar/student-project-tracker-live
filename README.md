# Student Project Tracker (Cloud Variant)

This repository is a hands-on web application development cloud variant migrating from a local SQLite setup to a serverless architecture powered by **Vercel** and **Supabase PostgreSQL**.

## Architecture & Differences
* **Database**: Uses Supabase PostgreSQL (via Transaction Pooler on port 6543) instead of local SQLite.
* **Data Persistence**: Local SQLite rows are not migrated; the database initializes dynamically on startup using `schema.sql`.
* **Access Control**: The application features shared demo records with no user sign-in mechanism.
* **Environment Security**: The `DATABASE_URL` secret is server-only and never exposed to the client or version control.

## Prerequisites & Configuration
To run this application locally, you must provide your own Supabase project credentials (future readers must create their own Supabase database and configure their own `.env` file; deployer secrets are not included in this repository).

1. Ensure you have **Node.js (v22+)** installed.
2. Create a private `.env` file in the root directory based on `.env.example`:
   ```env
   DATABASE_URL=postgres://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION][.pooler.supabase.com:6543/postgres](https://.pooler.supabase.com:6543/postgres)