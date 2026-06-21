(function () {
    'use strict';

    var form = document.getElementById('bookingForm');
    var message = document.getElementById('bookingMessage');
    if (!form) return;

    function setMessage(text, className) {
        message.textContent = text || '';
        message.className = 'form-message ' + (className || '');
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        setMessage('Sending booking...');
        fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
        })
            .then(function (response) {
                return response.json().then(function (data) {
                    if (!response.ok) throw new Error(data.message || 'Booking failed.');
                    return data;
                });
            })
            .then(function () {
                form.reset();
                setMessage('Thank you. Your table request has been sent.', 'success');
            })
            .catch(function (error) {
                setMessage(error.message, 'error');
            });
    });
})();
