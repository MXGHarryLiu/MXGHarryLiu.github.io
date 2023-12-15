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
    location.reload();
}

async function toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'en-US';
    const newLang = currentLang === 'en-US' ? 'zh-CN' : 'en-US';
    await setLanguagePreference(newLang);
    const langData = await fetchLanguageData(newLang);
    updateContent(langData, newLang);
}
function insertIcon(className, emoji) {
    const spans = document.querySelectorAll('.' + className);
    spans.forEach(span => {
        span.title = getContent(className);
        span.innerHTML = emoji;
    });
}
window.addEventListener('DOMContentLoaded', async () => {
    const userPreferredLanguage = localStorage.getItem('language') || 'en-US';
    const langData = await fetchLanguageData(userPreferredLanguage);
    
    function getContent(query) {
        const keys = query.split('/');
        let content = langData;
        for (const key of keys) {
            content = content[key];
            if (!content) break;
        }
        return content || '';
    }
    
    updateContent(langData, userPreferredLanguage);

    function insertIcon(className, emoji) {
        const spans = document.querySelectorAll('.' + className);
        spans.forEach(span => {
            span.title = getContent('icon/' + className);
            span.innerHTML = emoji;
        });
    }
    insertIcon('place', '🌐');
    insertIcon('date', '📅');
    insertIcon('focus', '💡');
    insertIcon('award', '🏆');
    insertIcon('course', '📚');

    function insertListMarker(className, icon, color) {
        const is = document.querySelectorAll('.i-' + className);
        is.forEach(i => {
            i.title = getContent('icon/' + className);
            i.classList.add('bi', icon);
            i.style.color = color
        });
    }
    insertListMarker('place', 'bi-geo-alt', '#3498db')
    insertListMarker('focus', 'bi-mortarboard', '#333')
    insertListMarker('date', 'bi-calendar2-check', '#e74c3c')
    insertListMarker('award', 'bi-trophy', '#ffd700')
    insertListMarker('course', 'bi-book', '#4caf50')
    insertListMarker('bullet', 'bi-arrow-right-short', '#808080')

    if (document.title === '') {
        document.title = getContent('basic/brand')
    } else {
        document.title = document.title + ' - ' + getContent('basic/brand')
    }
});