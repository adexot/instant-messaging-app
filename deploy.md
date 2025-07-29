# Deployment Guide

This document provides instructions for deploying the Instant Messaging App to various platforms.

## Prerequisites

- Node.js 18+
- Your Instant DB app ID
- A hosting platform account (Vercel, Netlify, etc.)

## Environment Variables

Ensure these environment variables are set in your deployment platform:

```env
VITE_INSTANT_APP_ID=your-instant-db-app-id-here
```

## Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard or via CLI:
```bash
vercel env add VITE_INSTANT_APP_ID
```

## Netlify Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify

3. Set environment variables in Netlify dashboard

## Manual Deployment

1. Build for production:
```bash
npm run build
```

2. Upload the `dist` folder to your web server

3. Configure your web server to serve the `index.html` file for all routes

## Performance Optimization

The build is already optimized with:
- Code splitting for better caching
- Minified assets
- Tree shaking for smaller bundles
- Optimized images and fonts

## Health Checks

After deployment, verify:
- [ ] App loads without errors
- [ ] Instant DB connection works
- [ ] Real-time messaging functions
- [ ] Mobile responsiveness
- [ ] Accessibility features work
- [ ] All tests pass in production environment

## Monitoring

Consider setting up:
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Web Vitals)
- Uptime monitoring
- User analytics

## Rollback Plan

Keep the previous deployment available for quick rollback if issues arise.