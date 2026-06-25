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

    if (window.App) {
        window.App.getImages()
            .then(function (images) {
                var menus = images.filter(function (image) { return image.category === 'menu'; });
                var items = images.filter(function (image) { return image.category === 'item'; });
                document.getElementById('menuImages').innerHTML = menus.length ? menus.map(imageMarkup).join('') : '<p>No menu images uploaded yet.</p>';
                document.getElementById('itemImages').innerHTML = items.length ? items.map(imageMarkup).join('') : '<p>No item images uploaded yet.</p>';
            })
            .catch(function (error) {
                document.getElementById('imagePageMessage').textContent = error.message;
            });
    }
})();
