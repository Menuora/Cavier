# Caviar Hotel Template

This template includes a public restaurant website, a hidden admin dashboard at `/admin`, Cloudinary image uploads, and table bookings.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env`.

3. Fill these values:

```bash
ADMIN_USERNAME=hoteladmin
ADMIN_PASSWORD=change-this-password
SESSION_SECRET=change-this-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Start the website:

```bash
npm run dev
```

5. Open:

- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Hosting

Use Vercel for the full template because bookings, admin login, and Cloudinary uploads need backend API routes.

GitHub Pages can host only the static public pages. The `/admin` dashboard, booking form, and image uploads will not work on GitHub Pages unless you connect a separate backend.

## Admin Features

- Login with credentials from environment variables.
- View table bookings.
- Upload full menu images to Cloudinary.
- Upload individual item images to Cloudinary.
- Public image page at `/images.html`.
- Edit website settings from the dashboard:
  - hotel name
  - social links
  - Google Maps embed link
  - opening hours
  - homepage and page header image links
