(function () {
    'use strict';

    var loginSection = document.getElementById('adminLogin');
    var dashboard = document.getElementById('adminDashboard');
    var loginForm = document.getElementById('adminLoginForm');
    var imageForm = document.getElementById('imageUploadForm');
    var settingsForm = document.getElementById('settingsForm');
    var imageSettingsForm = document.getElementById('imageSettingsForm');
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
            '</article>';
    }

    function imageCard(image) {
        return '<article class="admin-image-card">' +
            '<img src="' + image.url + '" alt="' + escapeHtml(image.title) + '">' +
            '<div><h3>' + escapeHtml(image.title) + '</h3><p>' + escapeHtml(image.category) + '</p></div>' +
            '</article>';
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
        });
    }

    async function request(url, options) {
        var response = await fetch(url, options || {});
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(data.message || 'Request failed.');
        return data;
    }

    async function loadDashboard() {
        bookingsList.innerHTML = '<p>Loading bookings...</p>';
        adminImages.innerHTML = '<p>Loading images...</p>';
        loadSettings();
        try {
            var bookingsData = await request('/api/admin/bookings');
            var bookings = bookingsData.bookings || [];
            bookingsList.innerHTML = bookings.length ? bookings.map(bookingCard).join('') : '<p>No bookings yet.</p>';
        } catch (error) {
            bookingsList.innerHTML = '<p>' + escapeHtml(error.message) + '</p>';
        }

        try {
            var imagesData = await request('/api/images');
            var images = imagesData.images || [];
            adminImages.innerHTML = images.length ? images.map(imageCard).join('') : '<p>No images uploaded yet.</p>';
        } catch (error) {
            adminImages.innerHTML = '<p>' + escapeHtml(error.message) + '</p>';
        }
    }

    async function loadSettings() {
        try {
            var data = await request('/api/settings');
            var settings = data.settings || {};
            Object.keys(settings).forEach(function (key) {
                if (settingsForm.elements[key]) settingsForm.elements[key].value = settings[key] || '';
                if (imageSettingsForm.elements[key]) imageSettingsForm.elements[key].value = settings[key] || '';
            });
        } catch (error) {
            setMessage('settingsMessage', error.message, 'error');
        }
    }

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('adminLoginMessage', 'Checking login...');
        try {
            await request('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(loginForm)))
            });
            loginForm.reset();
            showDashboard();
        } catch (error) {
            setMessage('adminLoginMessage', error.message, 'error');
        }
    });

    imageForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('uploadMessage', 'Uploading image...');
        try {
            await request('/api/admin/images', {
                method: 'POST',
                body: new FormData(imageForm)
            });
            imageForm.reset();
            setMessage('uploadMessage', 'Image uploaded.', 'success');
            loadDashboard();
        } catch (error) {
            setMessage('uploadMessage', error.message, 'error');
        }
    });

    settingsForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('settingsMessage', 'Saving settings...');
        try {
            await saveSettings(settingsForm);
            setMessage('settingsMessage', 'Settings saved.', 'success');
        } catch (error) {
            setMessage('settingsMessage', error.message, 'error');
        }
    });

    imageSettingsForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        setMessage('imageSettingsMessage', 'Saving images...');
        try {
            await saveSettings(imageSettingsForm);
            setMessage('imageSettingsMessage', 'Images saved.', 'success');
        } catch (error) {
            setMessage('imageSettingsMessage', error.message, 'error');
        }
    });

    async function saveSettings(changedForm) {
        var data = {};
        [settingsForm, imageSettingsForm].forEach(function (form) {
            Object.assign(data, Object.fromEntries(new FormData(form)));
        });
        await request('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', async function () {
        await fetch('/api/admin/logout', { method: 'POST' });
        showLogin();
    });

    request('/api/admin/me').then(showDashboard).catch(showLogin);
})();
