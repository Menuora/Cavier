(function () {
    'use strict';

    function setText(selector, value) {
        Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
            element.textContent = value;
        });
    }

    function setSocial(selector, url) {
        Array.prototype.forEach.call(document.querySelectorAll(selector), function (element) {
            if (url) {
                element.href = url;
                element.classList.remove('d-none');
            } else {
                element.classList.add('d-none');
            }
        });
    }

    function setMap(url) {
        var iframeMatch = String(url || '').match(/\ssrc=["']([^"']+)["']/i);
        if (iframeMatch) url = iframeMatch[1];
        Array.prototype.forEach.call(document.querySelectorAll('[data-map-frame]'), function (element) {
            if (!url) {
                element.innerHTML = '';
                element.classList.add('d-none');
                return;
            }
            element.classList.remove('d-none');
            element.innerHTML = '<iframe src="' + encodeURI(url) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
        });
    }

    function applyImages(settings) {
        Array.prototype.forEach.call(document.querySelectorAll('[data-bg-setting]'), function (element) {
            var key = element.getAttribute('data-bg-setting');
            if (settings[key]) element.style.backgroundImage = 'url("' + settings[key] + '")';
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-img-setting]'), function (element) {
            var key = element.getAttribute('data-img-setting');
            if (settings[key]) element.src = settings[key];
        });
    }

    fetch('/api/settings')
        .then(function (response) { return response.json().then(function (data) { return { ok: response.ok, data: data }; }); })
        .then(function (result) {
            if (!result.ok) return;
            var settings = result.data.settings || {};
            var hotelName = settings.hotelName || 'Caviar';
            setText('[data-hotel-name]', hotelName);
            setText('[data-opening-hours]', settings.openingHours || '');
            setSocial('[data-social-facebook]', settings.facebookUrl);
            setSocial('[data-social-instagram]', settings.instagramUrl);
            setSocial('[data-social-twitter]', settings.twitterUrl);
            setMap(settings.mapEmbedUrl);
            applyImages(settings);
        })
        .catch(function () {});
})();
