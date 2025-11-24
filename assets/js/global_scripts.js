let buttonDarkMode = null;
const PROJECT_BASE_PATH = '/hq_app';

function setDarkMode(dark) {
    if (dark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'on');
        if (buttonDarkMode) {
            buttonDarkMode.innerHTML = '<img class="btn-dark-mode-img" src="' + PROJECT_BASE_PATH + '/assets/img/sun.svg" alt="Sun" width="20" height="20">';
            buttonDarkMode.style.backgroundColor = 'var(--secondary-color)';
            buttonDarkMode.style.color = 'var(--primary-color)';
        }
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'off');
        if (buttonDarkMode) {
            buttonDarkMode.innerHTML = '<img class="btn-dark-mode-img" src="' + PROJECT_BASE_PATH + '/assets/img/moon.svg" alt="Moon" width="20" height="20">';
            buttonDarkMode.style.backgroundColor = 'var(--primary-color)';
            buttonDarkMode.style.color = 'var(--quinary-color)';
        }
    }
}

function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark-mode');
    setDarkMode(isDark);
}

$(document).ready(function () {
    $('#nav').on('click', function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: 0
        }, 600);
    });

    // Setup dark mode button
    const h_menusUp = document.querySelector('.h_menusUp');
    buttonDarkMode = h_menusUp.querySelector('.btn-dark-mode');

    if (buttonDarkMode) {
        // Remove old button if exists (for safety, reset)
        buttonDarkMode.remove();
        buttonDarkMode = null;
    }

    // Create and append the dark mode button
    buttonDarkMode = document.createElement('button');
    buttonDarkMode.classList.add('btn-dark-mode');
    buttonDarkMode.style.backgroundColor = 'var(--primary-color)';
    buttonDarkMode.style.color = 'var(--quinary-color)';
    buttonDarkMode.style.border = 'none';
    buttonDarkMode.style.borderRadius = '5px';
    buttonDarkMode.style.padding = '5px';
    buttonDarkMode.style.cursor = 'pointer';
    buttonDarkMode.style.fontSize = '1.2em';
    buttonDarkMode.style.fontWeight = 'bold';
    buttonDarkMode.addEventListener('click', toggleDarkMode);
    h_menusUp.appendChild(buttonDarkMode);

    // On load, set dark mode state from localStorage if present
    const darkModeSetting = localStorage.getItem('darkMode');
    if (darkModeSetting === 'on') {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }
});