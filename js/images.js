(function () {
    'use strict';

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
        });
    }

    function imageMarkup(image) {
        return '<article class="public-image-card">' +
            '<img src="' + image.url + '" alt="' + escapeHtml(image.title) + '">' +
            '<h3>' + escapeHtml(image.title) + '</h3>' +
            '</article>';
    }

    fetch('/api/images')
        .then(function (response) { return response.json().then(function (data) { return { ok: response.ok, data: data }; }); })
        .then(function (result) {
            if (!result.ok) throw new Error(result.data.message || 'Images could not be loaded.');
            var images = result.data.images || [];
            var menus = images.filter(function (image) { return image.category === 'menu'; });
            var items = images.filter(function (image) { return image.category === 'item'; });
            document.getElementById('menuImages').innerHTML = menus.length ? menus.map(imageMarkup).join('') : '<p>No menu images uploaded yet.</p>';
            document.getElementById('itemImages').innerHTML = items.length ? items.map(imageMarkup).join('') : '<p>No item images uploaded yet.</p>';
        })
        .catch(function (error) {
            document.getElementById('imagePageMessage').textContent = error.message;
        });
})();
