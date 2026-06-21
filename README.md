# Cavier Restaurant Template

This template includes a premium public restaurant website, an admin dashboard at `/admin`, Cloudinary image uploads, and table bookings. The application is completely serverless and runs on client-side Firebase (Auth & Firestore) and Cloudinary.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `js/env.example.js` to `js/env.js` and fill in your client's credentials:
   * **Firebase:** Create a Firebase project, enable **Email/Password Authentication** and **Cloud Firestore**, and copy the web app credentials.
   * **Cloudinary:** Create a Cloudinary account and enable an **Unsigned Upload Preset** (so the client side can upload images securely without exposing API secrets).
   * **Admin Email/Password:** Set the default login email and password.

3. Start the website:
   ```bash
   npm run dev
   ```

4. Open:
   * Website: `http://localhost:3000`
   * Admin Panel: `http://localhost:3000/admin` (Logging in with the default credentials for the first time will automatically provision the user in Firebase Auth!)

## Hosting

Because the template is now 100% serverless, it can be hosted on **any** static provider such as **GitHub Pages, Netlify, Vercel, or AWS S3**. Simply swap the `js/env.js` credentials file to deploy this site for a new hotel/restaurant client!

## Features

* **Real-time Table Bookings:** Submitted to Firestore and managed in real-time by the admin.
* **Website Configuration CMS:** Update hotel name, opening hours, social links, and Google Maps location instantly from the dashboard.
* **Homepage Gallery & Banner Management:** Update hero and section images dynamically.
* **Unsigned Media Uploads:** Upload full menus or individual dish items directly to Cloudinary and record metadata in Firestore.
* **Password Manager:** Update the admin password directly from the Admin Panel.

