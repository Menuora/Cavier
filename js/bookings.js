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
        
        if (!window.App) {
            setMessage('Application is not initialized.', 'error');
            return;
        }

        var bookingData = Object.fromEntries(new FormData(form));
        window.App.addBooking(bookingData)
            .then(function () {
                form.reset();
                setMessage('Thank you. Your table request has been sent.', 'success');
            })
            .catch(function (error) {
                setMessage(error.message, 'error');
            });
    });
})();
