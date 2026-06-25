This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load the Geist font family.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare

This app deploys to Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare) adapter.

```bash
npm run cf:build   # Build the Worker (.open-next/worker.js)
npm run preview    # Run the Worker locally on workerd
npm run deploy     # Build and deploy with wrangler
```

Set runtime secrets (OPENAI_API_KEY, Clerk, Supabase, Upstash, Gumroad, Microlink) in the Cloudflare Worker settings. See `CLAUDE.md` for details.
