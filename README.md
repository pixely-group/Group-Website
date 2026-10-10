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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Hero waitlist

The hero form posts to `/api/waitlist`. The server adds the address to a Brevo
contact list, sends the Pixely confirmation email, and records
`PIXELY_WAITLIST_CONFIRMED=true` only after Brevo accepts the message. Existing
confirmed or suppressed contacts do not receive another message. A failed send
leaves the contact saved and lets the visitor retry. Brevo idempotency guards
concurrent sends and short-term retries; this is not a durable email queue.

Configure these **server-side** environment variables locally and on your host:

- `BREVO_API_KEY`: Brevo API key (not an SMTP password or the base64 MCP wrapper).
- `BREVO_WAITLIST_LIST_ID`: numeric ID of a dedicated Pixely waitlist list.
- `BREVO_SENDER_EMAIL`: an active, verified sender in Brevo.
- `AUTH_URL`: public site origin when running behind a reverse proxy.

Create the boolean contact attribute `PIXELY_WAITLIST_CONFIRMED` in Brevo before
launch. Authorize the development and production outbound IPs in Brevo’s security
settings. The integration uses HTTPS for both contacts and transactional mail, so
SMTP credentials are unnecessary. Secrets belong in `.env.local` (ignored by Git)
or your deployment's secret environment settings.

The form includes a honeypot, validation and bounded per-instance throttling. For
multiple server instances, configure a shared rate limit at your hosting edge and
ensure the proxy overwrites `X-Forwarded-For`. Monitor `pixely-waitlist` email tags
in Brevo and server `Waitlist signup failed` logs for delivery/configuration errors.
API acceptance does not guarantee inbox delivery.

Run the signup regression checks with `node --test tests/waitlist.test.mjs`.
These mock Brevo and never create contacts or send mail.
