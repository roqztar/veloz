# Veloz Deployment Guide

## Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Using Git Integration (Automatic Deployments)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment - Veloz"
   git push
   ```

2. **Import project on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click **Deploy**

### Option 3: Using Vercel Web Interface (Manual)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select "Upload" → drag and drop the `dist/` folder
3. Your site will be live instantly!

---

## Post-Deployment

- **Production URL**: `https://veloz-yourname.vercel.app`
- **Custom Domain**: Configure in Vercel dashboard under Project Settings → Domains

## Environment Variables (if needed)

No environment variables required for this static site.

## Troubleshooting

- **404 on refresh**: Already configured in `vercel.json` with SPA rewrites
- **Assets not loading**: Check that `base` in `vite.config.ts` is set correctly (default `/` is fine for Vercel)
