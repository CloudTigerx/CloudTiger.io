document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach((input, index) => {
        input.setAttribute('tabindex', index + 1);
        input.setAttribute('data-validated', 'false');
    });

    const validationRules = {
        color: (value) => value !== '',
        date: (value) => value !== '',
        'datetime-local': (value) => value !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        month: (value) => value !== '',
        number: (value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 1 && num <= 100;
        },
        range: (value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 1 && num <= 100;
        },
        search: (value) => value.trim().length > 0,
        tel: (value) => /^\+?[0-9]{10,15}$/.test(value),
        time: (value) => value !== '',
        url: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        week: (value) => value !== ''
    };

    const errorMessages = {
        color: 'Please select a color',
        date: 'Please select a valid date',
        'datetime-local': 'Please select a valid date and time',
        email: 'Please enter a valid email address',
        month: 'Please select a valid month',
        number: 'Please enter a number between 1 and 100',
        range: 'Please select a value between 1 and 100',
        search: 'Please enter a search term',
        tel: 'Please enter a valid phone number (e.g., +1234567890)',
        time: 'Please select a valid time',
        url: 'Please enter a valid URL (e.g., https://example.com)',
        week: 'Please select a valid week'
    };

    inputs.forEach(input => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '0.8em';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.display = 'none';
        input.parentNode.insertBefore(errorDiv, input.nextSibling);

        input.addEventListener('input', function() {
            validateInput(this);
        });

        input.addEventListener('blur', function() {
            validateInput(this);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && !e.shiftKey) {
                if (this.getAttribute('data-validated') !== 'true') {
                    e.preventDefault();
                    validateInput(this);
                }
            }
        });
    });

    function validateInput(input) {
        const value = input.value;
        const type = input.type;
        const errorDiv = input.nextSibling;
        
        if (validationRules[type] && !validationRules[type](value)) {
            input.style.borderColor = 'red';
            errorDiv.textContent = errorMessages[type];
            errorDiv.style.display = 'block';
            input.setAttribute('data-validated', 'false');
            return false;
        } else {
            input.style.borderColor = 'green';
            errorDiv.style.display = 'none';
            input.setAttribute('data-validated', 'true');
            return true;
        }
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let allValid = true;
        inputs.forEach(input => {
            if (!validateInput(input)) {
                allValid = false;
                input.focus();
                return false;
            }
        });

        if (allValid) {
            alert('Form submitted successfully!');
        }
    });
});
