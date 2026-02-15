/**
 * Fetches i18n JSON payload for a language.
 * @param {string} lang Language code (for example: en-US, zh-CN).
 * @returns {Promise<object>} Parsed language dictionary.
 */
async function fetchLanguageData(lang) {
    const response = await fetch(`${lang}.json`, {
        method: 'GET',
        headers: {
            accept: 'application/json',
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch language file: ${lang}.json (${response.status})`);
    }
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`Invalid JSON in language file: ${lang}.json`);
    }
}

/**
 * Resolves a slash-delimited key path from an object.
 * @param {object} root Source object.
 * @param {string} path Slash-delimited path (for example: education/phd/title).
 * @returns {*} Resolved value, or undefined if not found.
 */
function getByPath(root, path) {
    if (!root || typeof path !== 'string' || path.length === 0) {
        return undefined;
    }
    return path.split('/').reduce((value, key) => {
        if (value === null || value === undefined) {
            return undefined;
        }
        return value[key];
    }, root);
}

/**
 * Converts minimal markdown links ([text](url)) to anchor tags.
 * @param {*} content Localized content value.
 * @returns {*} HTML string when input is a string; otherwise the original value.
 */
function renderInlineLinks(content) {
    if (typeof content !== 'string') {
        return content;
    }
    // Minimal markdown-style inline links: [text](url)
    return content.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, text, url) {
        return '<a href="' + url + '">' + text + '</a>';
    });
}

/**
 * Applies safe external-link attributes under a root element.
 * @param {Element} root Root element to scan.
 * @returns {void}
 */
function normalizeExternalLinks(root) {
    if (!root || !root.querySelectorAll) {
        return;
    }
    root.querySelectorAll('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) {
            anchor.setAttribute('target', '_blank');
            anchor.setAttribute('rel', 'noopener noreferrer');
        }
    });
}
/**
 * Updates DOM content, image alt/title text, and language switcher label.
 * @param {object} langData Language dictionary.
 * @param {string} lang Active language code.
 * @returns {void}
 */
function updateContent(langData, lang) {
    // main text
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keyPath = element.getAttribute('data-i18n');
        const content = getByPath(langData, keyPath);
        if (content !== undefined && content !== null) {
            element.innerHTML = renderInlineLinks(content);
            normalizeExternalLinks(element);
        }
    });
    // alt text
    document.querySelectorAll('img').forEach(image => {
        const src = image.getAttribute('src');
        const altPath = src ? `alt/${src}` : '';
        const content = getByPath(langData, altPath);
        if (content !== undefined && content !== null) {
            image.setAttribute('alt', content);
            image.setAttribute('title', content);
        }
    });
    // lang selector
    const langSelector = document.getElementById('lanSelector');
    if (langSelector) {
        if (lang === 'en-US') {
            langSelector.innerHTML = '中文';
        } else {
            langSelector.innerHTML = 'English';
        }
    }
}

/**
 * Persists user language preference.
 * @param {string} lang Language code.
 * @returns {void}
 */
function setLanguagePreference(lang) {
    localStorage.setItem('language', lang);
}

/**
 * Toggles between supported languages and refreshes localized content.
 * @param {Event} [event] Optional click event from language toggle UI.
 * @returns {Promise<void>}
 */
async function toggleLanguage(event) {
    if (event) {
        event.preventDefault();
    }
    const currentLang = localStorage.getItem('language') || 'en-US';
    const newLang = currentLang === 'en-US' ? 'zh-CN' : 'en-US';
    setLanguagePreference(newLang);
    // Intentionally refetch on each toggle so updated JSON content is picked up without hard-refresh.
    const langData = await fetchLanguageData(newLang);
    window.__langData = langData;
    updateContent(langData, newLang);
    applyI18nSideEffects(langData, newLang);
    document.dispatchEvent(new CustomEvent('i18n-ready'));
}

/**
 * Inserts icon glyph into matching spans.
 * @param {string} className CSS class (without dot).
 * @param {string} emoji Text/icon content to insert.
 * @returns {void}
 */
function insertIcon(className, emoji) {
    const spans = document.querySelectorAll('.' + className);
    spans.forEach(span => {
        span.title = getContent(className);
        span.innerHTML = emoji;
    });
}

/**
 * Applies post-i18n UI side effects (icon markers, document title, global getter).
 * @param {object} langData Language dictionary.
 * @param {string} lang Active language code.
 * @returns {void}
 */
function applyI18nSideEffects(langData, lang) {
    /**
     * Resolves localized value from global language data by slash path.
     * @param {string} query Slash-delimited i18n key path.
     * @returns {string} Localized string or empty string.
     */
    function getContent(query) {
        const content = getByPath(langData, query);
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

/**
 * Initializes i18n on page load.
 * @returns {Promise<void>}
 */
async function initializeI18n() {
    const userPreferredLanguage = localStorage.getItem('language') || 'en-US';
    // Intentionally refetch on load so deployment-side JSON updates are reflected immediately.
    const langData = await fetchLanguageData(userPreferredLanguage);
    window.__langData = langData;
    updateContent(langData, userPreferredLanguage);
    applyI18nSideEffects(langData, userPreferredLanguage);
    document.dispatchEvent(new CustomEvent('i18n-ready'));
}

window.addEventListener('DOMContentLoaded', initializeI18n);
