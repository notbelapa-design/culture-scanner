# Culture Scanner

This repository contains a simple prototype for a **culture scanner**—a
small web application that monitors Polymarket prediction markets for large
shifts in sentiment and volume.

The project uses [Next.js](https://nextjs.org/) for the frontend and
API routes, and is designed to be deployed on [Vercel](https://vercel.com/).
All of the source code lives in this repository so you can connect it to
your GitHub account and deploy directly to Vercel.

## What it does

* **Fetches market data** from the public Polymarket Gamma API
  (`https://gamma-api.polymarket.com/markets`).  This endpoint returns
  metadata for each market, including current odds (`outcomePrices`),
  trading volume (`volume24hr`, `volume1wk`, …) and price changes
  (`oneDayPriceChange`, `oneHourPriceChange`, etc.)【760619788126338†L146-L204】.
* **Computes an “attention score”** for each market based on its 24‑hour
  volume and recent price movement.  For example, the default formula
  multiplies the absolute value of the one‑day price change by the
  24‑hour volume (the bigger the move and the more volume, the higher
  the score).
* **Exposes a JSON API** under `/api/markets` which returns the
  processed markets sorted by attention score.  This endpoint is used
  internally by the client but can also be consumed by other
  applications (e.g. an RSS feed or a notification service).
* **Displays a dashboard** on the home page showing the top markets
  ranked by their attention level.  Each card shows the market question,
  current YES/NO probabilities, volume and price change.  A colour
  indicator conveys whether the price has increased (green) or
  decreased (red).
* **Provides a notification placeholder**: there is a form at the top of
  the page where users could enter an email address to subscribe to
  alerts.  The back‑end implementation for sending emails is not
  included in this prototype, but the front‑end wiring is there for
  future expansion.

## Running locally

1. Ensure you have [Node.js](https://nodejs.org/) installed (LTS
   version recommended).
2. Install dependencies and run the development server:

```bash
cd culture-scanner
npm install
npm run dev
```

3. Open http://localhost:3000 in your browser.  The page will show the
   top markets sorted by attention level.

## Deploying to Vercel

Once this repository is pushed to GitHub, you can deploy it by
connecting the repository to Vercel and selecting the `culture-scanner`
directory as the root.  Vercel automatically detects the Next.js
application and provisions the necessary infrastructure.

1. **Create a new GitHub repository** (e.g. `culture-scanner`) and push
   this folder to the repository.
2. **Sign in to Vercel**, click “New Project” and select the GitHub
   repository.
3. **Configure the build settings**: set the “Root Directory” to
   `culture-scanner`.  Leave the build and output settings at their
   defaults (Vercel automatically detects Next.js).
4. **Deploy**.  After a few moments the application will be live on
   your Vercel domain.

## Future work

This prototype lays the groundwork for a more sophisticated culture
scanner.  Possible future enhancements include:

* **Real‑time updates** using websockets to subscribe to price changes
  rather than polling the REST API.
* **More refined attention formulas**, incorporating metrics like
  liquidity, one‑hour vs. one‑day price changes, or weighting by
  category.
* **Notification support**, sending emails (or push notifications) when
  a market crosses a threshold.  A service like Postmark, SendGrid or
  AWS SES could be integrated via a Vercel Edge function.
* **User preferences**, allowing visitors to filter markets by
  categories (e.g. politics, sports) or by events they care about.

Feel free to fork or extend this project to suit your needs!
