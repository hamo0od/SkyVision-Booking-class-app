# SkyVision Classroom Booking

A Next.js and PostgreSQL classroom booking application with credential authentication, role-based administration, booking approval, timelines, and protected PDF attachments.

## Local development

Use Node.js 20.9 or newer and PostgreSQL. Create `.env` from `.env.example`, then run:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

The application is available at `http://localhost:3000`.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:booking-upload
npm run build
npm audit
```

## Ubuntu VPS deployment

Use the reviewed systemd and Nginx configuration in [deploy/README.md](deploy/README.md). It covers PostgreSQL migrations, secrets, TLS certificates, request limits, service isolation, updates, and rollback.