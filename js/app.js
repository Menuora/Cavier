// js/app.js - Firebase initialization and data access helpers
(function () {
    'use strict';

    // Verify config is set
    var hasFirebaseConfig = ENV && ENV.firebase && ENV.firebase.apiKey && ENV.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY';
    if (!hasFirebaseConfig) {
        console.warn('Firebase configuration is missing or using placeholder values. Please update js/env.js.');
    } else {
        // Initialize Firebase
        firebase.initializeApp(ENV.firebase);
    }

    // Export helpers to window.App
    window.App = {
        db: hasFirebaseConfig ? firebase.firestore() : null,
        auth: hasFirebaseConfig ? firebase.auth() : null,
        isConfigured: hasFirebaseConfig,

        // ── Authentication ──────────────────────────────────────────────────
        login: async function (email, password) {
            if (!this.isConfigured) throw new Error('Firebase is not configured. Please fill js/env.js.');
            
            try {
                // Try logging in
                return await this.auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                // If account does not exist and matches the env.js default credentials, auto-provision it
                var isDefaultCreds = ENV.admin && email === ENV.admin.email && password === ENV.admin.password;
                if (isDefaultCreds && (error.code === 'auth/user-not-found' || error.code === 'auth/user-disabled')) {
                    try {
                        return await this.auth.createUserWithEmailAndPassword(email, password);
                    } catch (regError) {
                        throw new Error('Auto-provisioning admin failed: ' + regError.message);
                    }
                }
                throw error;
            }
        },

        logout: function () {
            if (!this.auth) return Promise.resolve();
            return this.auth.signOut();
        },

        changePassword: async function (newPassword) {
            if (!this.auth || !this.auth.currentUser) throw new Error('No user is currently logged in.');
            return this.auth.currentUser.updatePassword(newPassword);
        },

        // ── Settings ────────────────────────────────────────────────────────
        getSettings: async function () {
            var defaultSettings = {
                hotelName: 'Caviar',
                openingHours: 'Open daily: 10:00 AM - 11:00 PM',
                facebookUrl: '',
                instagramUrl: '',
                twitterUrl: '',
                mapEmbedUrl: '',
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

            if (!this.db) return defaultSettings;

            try {
                var doc = await this.db.collection('settings').doc('main').get();
                if (doc.exists) {
                    return Object.assign({}, defaultSettings, doc.data());
                }
            } catch (e) {
                console.error('Error fetching settings:', e);
            }
            return defaultSettings;
        },

        saveSettings: async function (settings) {
            if (!this.db) throw new Error('Database not initialized.');
            return this.db.collection('settings').doc('main').set(settings, { merge: true });
        },

        // ── Bookings ────────────────────────────────────────────────────────
        getBookings: async function () {
            if (!this.db) return [];
            var snapshot = await this.db.collection('bookings').orderBy('createdAt', 'desc').get();
            var bookings = [];
            snapshot.forEach(function (doc) {
                var data = doc.data();
                data.id = doc.id;
                bookings.push(data);
            });
            return bookings;
        },

        addBooking: async function (booking) {
            if (!this.db) throw new Error('Database not initialized.');
            var cleanBooking = {
                name: String(booking.name || '').trim(),
                phone: String(booking.phone || '').trim(),
                email: String(booking.email || '').trim(),
                date: String(booking.date || '').trim(),
                time: String(booking.time || '').trim(),
                guests: String(booking.guests || '').trim(),
                message: String(booking.message || '').trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            if (!cleanBooking.name || !cleanBooking.phone || !cleanBooking.date || !cleanBooking.time || !cleanBooking.guests) {
                throw new Error('Please fill name, phone, date, time, and guests.');
            }

            return this.db.collection('bookings').add(cleanBooking);
        },

        deleteBooking: async function (id) {
            if (!this.db) throw new Error('Database not initialized.');
            return this.db.collection('bookings').doc(id).delete();
        },

        // ── Images ──────────────────────────────────────────────────────────
        getImages: async function () {
            if (!this.db) return [];
            var snapshot = await this.db.collection('images').orderBy('createdAt', 'desc').get();
            var images = [];
            snapshot.forEach(function (doc) {
                var data = doc.data();
                data.id = doc.id;
                images.push(data);
            });
            return images;
        },

        addImageMetadata: async function (image) {
            if (!this.db) throw new Error('Database not initialized.');
            var cleanImage = {
                title: String(image.title || '').trim(),
                category: image.category === 'item' ? 'item' : 'menu',
                url: String(image.url || '').trim(),
                createdAt: new Date().toISOString()
            };
            if (!cleanImage.url) throw new Error('Image URL is required.');
            return this.db.collection('images').add(cleanImage);
        },

        deleteImageMetadata: async function (id) {
            if (!this.db) throw new Error('Database not initialized.');
            return this.db.collection('images').doc(id).delete();
        },

        // Direct unsigned image upload to Cloudinary
        uploadImageToCloudinary: async function (file) {
            if (!ENV.cloudinary || !ENV.cloudinary.cloudName || ENV.cloudinary.cloudName === 'YOUR_CLOUD_NAME') {
                throw new Error('Cloudinary is not configured. Please fill js/env.js.');
            }

            var formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', ENV.cloudinary.uploadPreset);

            var url = 'https://api.cloudinary.com/v1_1/' + ENV.cloudinary.cloudName + '/image/upload';
            var response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            var data = await response.json();
            if (!response.ok) {
                throw new Error(data.error ? data.error.message : 'Cloudinary upload failed.');
            }
            return data.secure_url;
        }
    };
})();
