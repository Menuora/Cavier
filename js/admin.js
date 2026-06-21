// js/admin.js - Admin dashboard logic using Firebase & Cloudinary
(function () {
    'use strict';

    var loginSection = document.getElementById('adminLogin');
    var dashboard = document.getElementById('adminDashboard');
    var loginForm = document.getElementById('adminLoginForm');
    var imageForm = document.getElementById('imageUploadForm');
    var settingsForm = document.getElementById('settingsForm');
    var imageSettingsForm = document.getElementById('imageSettingsForm');
    var changePasswordForm = document.getElementById('changePasswordForm');
    var bookingsList = document.getElementById('bookingsList');
    var adminImages = document.getElementById('adminImages');

    function setMessage(id, message, type) {
        var element = document.getElementById(id);
        if (!element) return;
        element.textContent = message || '';
        element.className = 'form-message ' + (type || '');
    }

    function showDashboard() {
        loginSection.classList.add('d-none');
        dashboard.classList.remove('d-none');
        loadDashboard();
    }

    function showLogin() {
        loginSection.classList.remove('d-none');
        dashboard.classList.add('d-none');
    }

    function bookingCard(booking) {
        return '<article class="admin-list-item">' +
            '<h3>' + escapeHtml(booking.name) + '</h3>' +
            '<p><strong>' + escapeHtml(booking.date) + '</strong> at <strong>' + escapeHtml(booking.time) + '</strong></p>' +
            '<p>' + escapeHtml(booking.guests) + ' guest(s) | ' + escapeHtml(booking.phone) + '</p>' +
            '<p>' + escapeHtml(booking.email || 'No email') + '</p>' +
            '<p>' + escapeHtml(booking.message || '') + '</p>' +
            '<button type="button" class="btn caviar-btn delete-booking-btn" data-id="' + booking.id + '" style="margin-top: 10px; padding: 5px 15px; font-size: 12px; height: auto;"><span></span> Delete</button>' +
            '</article>';
    }

    function imageCard(image) {
        return '<article class="admin-image-card" style="position: relative;">' +
            '<img src="' + image.url + '" alt="' + escapeHtml(image.title) + '">' +
            '<div><h3>' + escapeHtml(image.title) + '</h3><p>' + escapeHtml(image.category) + '</p></div>' +
            '<button type="button" class="btn caviar-btn delete-image-btn" data-id="' + image.id + '" style="position: absolute; top: 10px; right: 10px; padding: 5px 10px; font-size: 11px; height: auto; background-color: #dc3545; border-color: transparent;">Delete</button>' +
            '</article>';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
        });
    }

    async function loadDashboard() {
        if (!window.App || !window.App.isConfigured) return;

        bookingsList.innerHTML = '<p>Loading bookings...</p>';
        adminImages.innerHTML = '<p>Loading images...</p>';
        
        // Load Settings
        try {
            var settings = await window.App.getSettings();
            Object.keys(settings).forEach(function (key) {
                if (settingsForm.elements[key]) settingsForm.elements[key].value = settings[key] || '';
                if (imageSettingsForm.elements[key]) imageSettingsForm.elements[key].value = settings[key] || '';
            });
        } catch (error) {
            setMessage('settingsMessage', error.message, 'error');
        }

        // Load Bookings
        try {
            var bookings = await window.App.getBookings();
            bookingsList.innerHTML = bookings.length ? bookings.map(bookingCard).join('') : '<p>No bookings yet.</p>';
            
            // Attach delete handlers for bookings
            Array.prototype.forEach.call(bookingsList.querySelectorAll('.delete-booking-btn'), function (btn) {
                btn.addEventListener('click', async function () {
                    var id = btn.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this booking?')) {
                        try {
                            btn.disabled = true;
                            btn.textContent = 'Deleting...';
                            await window.App.deleteBooking(id);
                            loadDashboard();
                        } catch (error) {
                            alert(error.message);
                            btn.disabled = false;
                            btn.textContent = 'Delete';
                        }
                    }
                });
            });
        } catch (error) {
            bookingsList.innerHTML = '<p>' + escapeHtml(error.message) + '</p>';
        }

        // Load Images
        try {
            var images = await window.App.getImages();
            adminImages.innerHTML = images.length ? images.map(imageCard).join('') : '<p>No images uploaded yet.</p>';
            
            // Attach delete handlers for images
            Array.prototype.forEach.call(adminImages.querySelectorAll('.delete-image-btn'), function (btn) {
                btn.addEventListener('click', async function () {
                    var id = btn.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this image?')) {
                        try {
                            btn.disabled = true;
                            btn.textContent = '...';
                            await window.App.deleteImageMetadata(id);
                            loadDashboard();
                        } catch (error) {
                            alert(error.message);
                            btn.disabled = false;
                            btn.textContent = 'Delete';
                        }
                    }
                });
            });
        } catch (error) {
            adminImages.innerHTML = '<p>' + escapeHtml(error.message) + '</p>';
        }
    }

    // ── Forms Submission Handlers ───────────────────────────────────────────

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('adminLoginMessage', 'Checking login...');
        
        var email = loginForm.elements.email.value;
        var password = loginForm.elements.password.value;

        try {
            await window.App.login(email, password);
            loginForm.reset();
            setMessage('adminLoginMessage', '');
        } catch (error) {
            setMessage('adminLoginMessage', error.message, 'error');
        }
    });

    imageForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('uploadMessage', 'Uploading image to Cloudinary...');
        
        var file = imageForm.elements.image.files[0];
        var title = imageForm.elements.title.value;
        var category = imageForm.elements.category.value;

        if (!file) {
            setMessage('uploadMessage', 'Choose an image first.', 'error');
            return;
        }

        try {
            var imageUrl = await window.App.uploadImageToCloudinary(file);
            setMessage('uploadMessage', 'Saving image reference to database...');
            await window.App.addImageMetadata({
                title: title,
                category: category,
                url: imageUrl
            });
            imageForm.reset();
            setMessage('uploadMessage', 'Image uploaded successfully.', 'success');
            loadDashboard();
        } catch (error) {
            setMessage('uploadMessage', error.message, 'error');
        }
    });

    async function saveSettings(changedForm, messageId) {
        var data = {};
        [settingsForm, imageSettingsForm].forEach(function (form) {
            Object.assign(data, Object.fromEntries(new FormData(form)));
        });
        
        try {
            await window.App.saveSettings(data);
            setMessage(messageId, 'Settings saved successfully.', 'success');
        } catch (error) {
            setMessage(messageId, error.message, 'error');
        }
    }

    settingsForm.addEventListener('submit', function (event) {
        event.preventDefault();
        setMessage('settingsMessage', 'Saving settings...');
        saveSettings(settingsForm, 'settingsMessage');
    });

    imageSettingsForm.addEventListener('submit', function (event) {
        event.preventDefault();
        setMessage('imageSettingsMessage', 'Saving images...');
        saveSettings(imageSettingsForm, 'imageSettingsMessage');
    });

    changePasswordForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('changePasswordMessage', 'Updating password...');
        
        var newPassword = changePasswordForm.elements.newPassword.value;
        if (!newPassword || newPassword.length < 6) {
            setMessage('changePasswordMessage', 'Password must be at least 6 characters.', 'error');
            return;
        }

        try {
            await window.App.changePassword(newPassword);
            changePasswordForm.reset();
            setMessage('changePasswordMessage', 'Password updated successfully.', 'success');
        } catch (error) {
            setMessage('changePasswordMessage', error.message, 'error');
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async function () {
        if (window.App) {
            await window.App.logout();
        }
    });

    // ── Session state listener ──────────────────────────────────────────────
    if (window.App && window.App.isConfigured) {
        window.App.auth.onAuthStateChanged(function (user) {
            if (user) {
                showDashboard();
            } else {
                showLogin();
            }
        });
    } else {
        setMessage('adminLoginMessage', 'Firebase is not configured. Please fill js/env.js first.', 'error');
    }
})();
