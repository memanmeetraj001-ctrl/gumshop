# GumShop  - Installation & Deployment Guide

## Option A: Local Development Setup
1. Clone or extract the project archive.
2. In `backend/`: run `npm install`, `npm run build`, and `node dist/index.js`.
3. In `frontend/`: run `npm install` and `npm run dev`.
4. Access the application at `http://localhost:5173`.

## Option B: Production Deployment (Railway / Render / VPS)

### Backend (Node.js Service)
- Set Environment Variables:
  - `PORT=5000`
  - `JWT_SECRET=<your-32-byte-secret-key>`
  - `NODE_ENV=production`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/index.js`

### Frontend (Static Site / Nginx)
- Build Command: `npm install && npm run build`
- Output Directory: `dist`
- Set up reverse proxy for `/api/*` requests pointing to your backend API server.
