async function fetchLanguageData(lang) {
    const response = await fetch(`${lang}.json`, 
        {
            method: 'GET',
            headers: {
                accept: 'application/json',
            }
        }
    );
    return response.json();
}
function updateContent(langData, lang) {
    // main text
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keys = element.getAttribute('data-i18n').split('/');
        let content = langData;
        for (const key of keys) {
            content = content[key];
            if (!content) break;
        }
        if (content) {
            element.innerHTML = content;
        }
    });
    // alt text
    document.querySelectorAll('img').forEach(image => {
        const keys = image.getAttribute('src').split('/'); 
        let content = langData.alt;
        for (const key of keys) {
            content = content[key];
            if (!content) break;
        }
        if (content) {
            image.setAttribute('alt', content);
            image.setAttribute('title', content);
        }
    });
    // lang selector
    const lanSelector = document.getElementById('lanSelector');
    if (lang == 'en-US') {
        lanSelector.innerHTML = '中文';
    } else {
        lanSelector.innerHTML = 'English';
    }
}
function setLanguagePreference(lang) {
    localStorage.setItem('language', lang);
}

async function toggleLanguage(event) {
    if (event) {
        event.preventDefault();
    }
    const currentLang = localStorage.getItem('language') || 'en-US';
    const newLang = currentLang === 'en-US' ? 'zh-CN' : 'en-US';
    setLanguagePreference(newLang);
    const langData = await fetchLanguageData(newLang);
    window.__langData = langData;
    updateContent(langData, newLang);
    applyI18nSideEffects(langData, newLang);
    document.dispatchEvent(new CustomEvent('i18n-ready'));
}
function insertIcon(className, emoji) {
    const spans = document.querySelectorAll('.' + className);
    spans.forEach(span => {
        span.title = getContent(className);
        span.innerHTML = emoji;
    });
}
function applyI18nSideEffects(langData, lang) {
    function getContent(query) {
        const keys = query.split('/');
        let content = langData;
        for (const key of keys) {
            content = content[key];
            if (!content) break;
        }
        return content || '';
    }
    window.getContent = getContent;

    function insertListMarker(className, icon, color) {
        const is = document.querySelectorAll('.i-' + className);
        is.forEach(i => {
            i.title = getContent('icon/' + className);
            i.classList.add('bi', icon);
            i.style.color = color;
        });
    }
    insertListMarker('place', 'bi-geo-alt', '#3498db') //blue
    insertListMarker('focus', 'bi-mortarboard', '#333') //gray
    insertListMarker('date', 'bi-calendar2-check', '#e74c3c') //red
    insertListMarker('award', 'bi-trophy', '#ffd700') //yellow/gold
    insertListMarker('course', 'bi-book', '#4caf50') //green
    insertListMarker('skill', 'bi-rocket', '#c8a2c8') //purple
    insertListMarker('team', 'bi-people', '#ffa500') //orange

    insertListMarker('arrow', 'bi-arrow-right-short', '#808080')
    insertListMarker('dot', 'bi-dot', '#808080')

    if (document.title === '') {
        document.title = getContent('basic/brand');
    } else {
        document.title = document.title.split(' - ')[0] + ' - ' + getContent('basic/brand');
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const userPreferredLanguage = localStorage.getItem('language') || 'en-US';
    const langData = await fetchLanguageData(userPreferredLanguage);
    window.__langData = langData;
    updateContent(langData, userPreferredLanguage);
    applyI18nSideEffects(langData, userPreferredLanguage);
    document.dispatchEvent(new CustomEvent('i18n-ready'));
});
