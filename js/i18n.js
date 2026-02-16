const MARKER_CONFIG = [
    { key: 'place', icon: 'bi-geo-alt', color: '#3498db' },
    { key: 'focus', icon: 'bi-mortarboard', color: '#333' },
    { key: 'date', icon: 'bi-calendar2-check', color: '#e74c3c' },
    { key: 'award', icon: 'bi-trophy', color: '#ffd700' },
    { key: 'course', icon: 'bi-book', color: '#4caf50' },
    { key: 'skill', icon: 'bi-rocket', color: '#c8a2c8' },
    { key: 'team', icon: 'bi-people', color: '#ffa500' },
    { key: 'reference', icon: 'bi-link-45deg', color: '#7e57c2' },
    { key: 'arrow', icon: 'bi-arrow-right-short', color: '#808080' },
    { key: 'dot', icon: 'bi-dot', color: '#808080' }
];

/**
 * i18n manager responsible for fetching locale data and applying localized content.
 */
class I18nManager {
    /**
     * Creates an i18n manager.
     * @param {object} [options] Optional manager settings.
     * @param {Array<{key: string, icon: string, color: string}>} [options.markerConfig] Marker style config.
     */
    constructor(options = {}) {
        this.markerConfig = options.markerConfig || MARKER_CONFIG;
        this.langData = {};
    }

    #dispatchI18nReady() {
        document.dispatchEvent(new CustomEvent('i18n-ready'));
    }

    #insertListMarker(className, icon, color) {
        const is = document.querySelectorAll('.i-' + className);
        is.forEach(i => {
            i.title = this.getContent('icon/' + className);
            i.classList.add('bi', icon);
            i.style.color = color;
        });
    }

    #applyBrandTitle() {
        if (document.title === '') {
            document.title = this.getContent('basic/brand');
        } else {
            document.title = document.title.split(' - ')[0] + ' - ' + this.getContent('basic/brand');
        }
    }

    /**
     * Fetches i18n JSON payload for a language.
     * @param {string} lang Language code (for example: en-US, zh-CN).
     * @returns {Promise<object>} Parsed language dictionary.
     */
    async fetchLanguageData(lang) {
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
    getByPath(root, path) {
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
     * Resolves localized value by slash path from current language dictionary.
     * @param {string} query Slash-delimited i18n key path.
     * @param {string} [defaultValue=''] Fallback value when key is missing.
     * @returns {string} Localized string or fallback value.
     */
    getContent(query, defaultValue = '') {
        const content = this.getByPath(this.langData, query);
        if (content === undefined || content === null || content === '') {
            return defaultValue;
        }
        return content;
    }

    /**
     * Converts minimal markdown links ([text](url)) to anchor tags.
     * @param {*} content Localized content value.
     * @returns {*} HTML string when input is a string; otherwise the original value.
     */
    renderInlineLinks(content) {
        if (typeof content !== 'string') {
            return content;
        }
        return content.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, text, url) {
            return '<a href="' + url + '">' + text + '</a>';
        });
    }

    /**
     * Applies safe external-link attributes under a root element.
     * @param {Element} root Root element to scan.
     * @returns {void}
     */
    normalizeExternalLinks(root) {
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
    updateContent(langData, lang) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const keyPath = element.getAttribute('data-i18n');
            const content = this.getByPath(langData, keyPath);
            if (content !== undefined && content !== null) {
                element.innerHTML = this.renderInlineLinks(content);
                this.normalizeExternalLinks(element);
            }
        });

        document.querySelectorAll('img').forEach(image => {
            const src = image.getAttribute('src');
            const altPath = src ? `alt/${src}` : '';
            const content = this.getByPath(langData, altPath);
            if (content !== undefined && content !== null) {
                image.setAttribute('alt', content);
                image.setAttribute('title', content);
            }
        });

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
    setLanguagePreference(lang) {
        localStorage.setItem('language', lang);
    }

    /**
     * Applies post-i18n UI side effects (icon markers, document title, global getter).
     * @param {object} langData Language dictionary.
     * @param {string} lang Active language code.
     * @returns {void}
     */
    applyI18nSideEffects(langData, lang) {
        this.langData = langData || this.langData;
        this.markerConfig.forEach(marker => {
            this.#insertListMarker(marker.key, marker.icon, marker.color);
        });
        this.#applyBrandTitle();
    }

    /**
     * Toggles between supported languages and refreshes localized content.
     * @param {Event} [event] Optional click event from language toggle UI.
     * @returns {Promise<void>}
     */
    async toggleLanguage(event) {
        if (event) {
            event.preventDefault();
        }
        const currentLang = localStorage.getItem('language') || 'en-US';
        const newLang = currentLang === 'en-US' ? 'zh-CN' : 'en-US';
        this.setLanguagePreference(newLang);
        // Intentionally refetch on each toggle so updated JSON content is picked up without hard-refresh.
        const langData = await this.fetchLanguageData(newLang);
        this.langData = langData;
        this.updateContent(langData, newLang);
        this.applyI18nSideEffects(langData, newLang);
        this.#dispatchI18nReady();
    }

    /**
     * Initializes i18n on page load.
     * @returns {Promise<void>}
     */
    async initializeI18n() {
        const userPreferredLanguage = localStorage.getItem('language') || 'en-US';
        // Intentionally refetch on load so deployment-side JSON updates are reflected immediately.
        const langData = await this.fetchLanguageData(userPreferredLanguage);
        this.langData = langData;
        this.updateContent(langData, userPreferredLanguage);
        this.applyI18nSideEffects(langData, userPreferredLanguage);
        this.#dispatchI18nReady();
    }
}

window.i18nManager = new I18nManager();

/**
 * Fetches i18n JSON payload for a language.
 * @param {string} lang Language code (for example: en-US, zh-CN).
 * @returns {Promise<object>} Parsed language dictionary.
 */
function fetchLanguageData(lang) {
    return window.i18nManager.fetchLanguageData(lang);
}

/**
 * Resolves a slash-delimited key path from an object.
 * @param {object} root Source object.
 * @param {string} path Slash-delimited path (for example: education/phd/title).
 * @returns {*} Resolved value, or undefined if not found.
 */
function getByPath(root, path) {
    return window.i18nManager.getByPath(root, path);
}

/**
 * Resolves localized value by slash path from current language dictionary.
 * @param {string} query Slash-delimited i18n key path.
 * @param {string} [defaultValue=''] Fallback value when key is missing.
 * @returns {string} Localized string or fallback value.
 */
function getContent(query, defaultValue = '') {
    return window.i18nManager.getContent(query, defaultValue);
}

/**
 * Converts minimal markdown links ([text](url)) to anchor tags.
 * @param {*} content Localized content value.
 * @returns {*} HTML string when input is a string; otherwise the original value.
 */
function renderInlineLinks(content) {
    return window.i18nManager.renderInlineLinks(content);
}

/**
 * Applies safe external-link attributes under a root element.
 * @param {Element} root Root element to scan.
 * @returns {void}
 */
function normalizeExternalLinks(root) {
    return window.i18nManager.normalizeExternalLinks(root);
}

/**
 * Updates DOM content, image alt/title text, and language switcher label.
 * @param {object} langData Language dictionary.
 * @param {string} lang Active language code.
 * @returns {void}
 */
function updateContent(langData, lang) {
    return window.i18nManager.updateContent(langData, lang);
}

/**
 * Persists user language preference.
 * @param {string} lang Language code.
 * @returns {void}
 */
function setLanguagePreference(lang) {
    return window.i18nManager.setLanguagePreference(lang);
}

/**
 * Toggles between supported languages and refreshes localized content.
 * @param {Event} [event] Optional click event from language toggle UI.
 * @returns {Promise<void>}
 */
async function toggleLanguage(event) {
    return window.i18nManager.toggleLanguage(event);
}

/**
 * Applies post-i18n UI side effects (icon markers, document title, global getter).
 * @param {object} langData Language dictionary.
 * @param {string} lang Active language code.
 * @returns {void}
 */
function applyI18nSideEffects(langData, lang) {
    return window.i18nManager.applyI18nSideEffects(langData, lang);
}

/**
 * Initializes i18n on page load.
 * @returns {Promise<void>}
 */
async function initializeI18n() {
    return window.i18nManager.initializeI18n();
}

window.getContent = getContent;
window.toggleLanguage = toggleLanguage;
window.addEventListener('DOMContentLoaded', initializeI18n);
