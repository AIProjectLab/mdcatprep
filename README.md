This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## MDCAT Pro

MDCAT Pro is a Clerk-authenticated MDCAT practice platform with a free 30-question diagnostic, a daily 10-question challenge, Pro 30/90/180-question tests, score review, and manual Easypaisa payment verification.

- Production app: `https://mdcat.techangles.com`
- Question bank: `src/data/questions.json`
- Admin payment review: `/admin` (requires Clerk Public metadata `{"role":"admin"}`)
- Pro access is granted manually after checking the submitted Easypaisa transaction ID.

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

## Adding MCQs

The live question bank is `src/data/questions.json`. To add an AI Studio JSON export, place the file in the project and run:

```bash
npm run import:questions -- path/to/export.json --source "KMU 2025" --year 2025
npm run validate:questions
npm run lint
npm run build
```

The importer accepts the app format (`id`, `answer`) and extractor format (`number`, `correct`). It requires a valid subject, source, year, at least four options (`A`–`D`; optional `E` is preserved), and an answer. After checking the result, commit and push `src/data/questions.json`; Vercel will deploy the updated bank automatically.

The daily challenge uses browser storage to limit one challenge per day. It is an engagement feature, not a security boundary; Pro access is controlled through Clerk metadata.

You can start editing the homepage by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The app deploys from the `main` branch of [AIProjectLab/mdcatprep](https://github.com/AIProjectLab/mdcatprep) on Vercel. Pushes to `main` trigger a deployment.

For Production, configure Clerk `pk_live_...` and `sk_live_...` keys and the public Easypaisa variables from `.env.example` in Vercel. Never commit `.env` or OAuth secrets.

The production domain is `https://mdcat.techangles.com`.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
