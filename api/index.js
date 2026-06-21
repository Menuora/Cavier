require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const rootDir = path.join(__dirname, '..');

const imageFolder = 'caviar-template/menu-images';
const bookingFolder = 'caviar-template/bookings';
const settingsFolder = 'caviar-template/settings';
const settingsPublicId = `${settingsFolder}/website`;

const defaultSettings = {
  hotelName: 'Caviar',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  mapEmbedUrl: '',
  openingHours: 'Open daily: 10:00 AM - 11:00 PM',
  heroImage1: '',
  heroCornerImage1: '',
  heroImage2: '',
  heroCornerImage2: '',
  aboutImage1: '',
  aboutImage2: '',
  reservationImage: '',
  menuHeaderImage: '',
  imagesHeaderImage: '',
  contactHeaderImage: ''
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(rootDir));

function requireConfig() {
  const required = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SESSION_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment values: ${missing.join(', ')}`);
    error.status = 500;
    throw error;
  }
}

function tokenFor(username) {
  return jwt.sign({ username }, process.env.SESSION_SECRET, { expiresIn: '8h' });
}

function requireAdmin(req, res, next) {
  try {
    requireConfig();
    const token = req.cookies.caviar_admin;
    if (!token) return res.status(401).json({ message: 'Login required.' });
    req.admin = jwt.verify(token, process.env.SESSION_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Login required.' });
  }
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

function normalizeSettings(input) {
  return {
    hotelName: String(input.hotelName || defaultSettings.hotelName).trim(),
    facebookUrl: String(input.facebookUrl || '').trim(),
    instagramUrl: String(input.instagramUrl || '').trim(),
    twitterUrl: String(input.twitterUrl || '').trim(),
    mapEmbedUrl: String(input.mapEmbedUrl || '').trim(),
    openingHours: String(input.openingHours || defaultSettings.openingHours).trim(),
    heroImage1: String(input.heroImage1 || '').trim(),
    heroCornerImage1: String(input.heroCornerImage1 || '').trim(),
    heroImage2: String(input.heroImage2 || '').trim(),
    heroCornerImage2: String(input.heroCornerImage2 || '').trim(),
    aboutImage1: String(input.aboutImage1 || '').trim(),
    aboutImage2: String(input.aboutImage2 || '').trim(),
    reservationImage: String(input.reservationImage || '').trim(),
    menuHeaderImage: String(input.menuHeaderImage || '').trim(),
    imagesHeaderImage: String(input.imagesHeaderImage || '').trim(),
    contactHeaderImage: String(input.contactHeaderImage || '').trim()
  };
}

async function loadSettings() {
  try {
    const resource = await cloudinary.api.resource(settingsPublicId, { resource_type: 'raw' });
    const response = await fetch(resource.secure_url);
    const settings = await response.json();
    return normalizeSettings(settings);
  } catch (error) {
    return defaultSettings;
  }
}

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

app.post('/api/admin/login', (req, res) => {
  try {
    requireConfig();
    const { username, password } = req.body;
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }
    res.cookie('caviar_admin', tokenFor(username), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000
    });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Login failed.' });
  }
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  res.clearCookie('caviar_admin');
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

app.get('/api/settings', async (req, res) => {
  try {
    requireConfig();
    const settings = await loadSettings();
    res.json({ settings });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Settings could not be loaded.' });
  }
});

app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = normalizeSettings(req.body);
    const payload = Buffer.from(JSON.stringify(settings, null, 2));
    await uploadBuffer(payload, {
      resource_type: 'raw',
      folder: settingsFolder,
      public_id: 'website',
      overwrite: true
    });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Settings could not be saved.' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    requireConfig();
    const booking = {
      id: crypto.randomUUID(),
      name: String(req.body.name || '').trim(),
      phone: String(req.body.phone || '').trim(),
      email: String(req.body.email || '').trim(),
      date: String(req.body.date || '').trim(),
      time: String(req.body.time || '').trim(),
      guests: String(req.body.guests || '').trim(),
      message: String(req.body.message || '').trim(),
      createdAt: new Date().toISOString()
    };

    if (!booking.name || !booking.phone || !booking.date || !booking.time || !booking.guests) {
      return res.status(400).json({ message: 'Please fill name, phone, date, time, and guests.' });
    }

    const payload = Buffer.from(JSON.stringify(booking, null, 2));
    await uploadBuffer(payload, {
      resource_type: 'raw',
      folder: bookingFolder,
      public_id: booking.id,
      overwrite: true
    });

    res.status(201).json({ ok: true, booking });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Booking could not be saved.' });
  }
});

app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  try {
    const resources = await cloudinary.search
      .expression(`folder:${bookingFolder} AND resource_type:raw`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const bookings = await Promise.all((resources.resources || []).map(async (item) => {
      const response = await fetch(item.secure_url);
      return response.json();
    }));

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Bookings could not be loaded.' });
  }
});

app.post('/api/admin/images', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose an image first.' });
    const category = req.body.category === 'item' ? 'item' : 'menu';
    const title = String(req.body.title || '').trim() || (category === 'item' ? 'Menu item' : 'Menu');
    const result = await uploadBuffer(req.file.buffer, {
      resource_type: 'image',
      folder: `${imageFolder}/${category}`,
      tags: ['caviar-template', category],
      context: { title, category }
    });

    res.status(201).json({
      image: {
        id: result.public_id,
        title,
        category,
        url: result.secure_url,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Image could not be uploaded.' });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    requireConfig();
    const resources = await cloudinary.search
      .expression(`(folder:${imageFolder}/menu OR folder:${imageFolder}/item) AND resource_type:image`)
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const images = (resources.resources || []).map((item) => ({
      id: item.public_id,
      title: item.context?.custom?.title || 'Menu image',
      category: item.context?.custom?.category || (item.public_id.includes('/item/') ? 'item' : 'menu'),
      url: item.secure_url,
      createdAt: item.created_at
    }));

    res.json({ images });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Images could not be loaded.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Caviar template running on http://localhost:${port}`));
}

module.exports = app;
