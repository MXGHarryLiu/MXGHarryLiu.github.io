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

const LOCALE_CONFIG = [
    { code: 'en-US', switchLabel: '中文' },
    { code: 'zh-CN', switchLabel: 'English' }
];
const LOCALE_STORAGE_KEY = 'locale';
const LOCALE_QUERY_KEY = 'lang';
const I18N_READY_EVENT = 'i18n-ready';

/**
 * i18n manager responsible for fetching locale data and applying localized content.
 */
class I18nManager {
    /**
     * Creates an i18n manager.
     * @param {object} [options] Optional manager settings.
     * @param {Array<{code: string, switchLabel: string}>} [options.locales] Supported locale options.
     */
    constructor(options = {}) {
        this.locales = options.locales || LOCALE_CONFIG;
        this.defaultLocale = this.locales.length > 0 ? this.locales[0].code : 'en-US';
        this.currentLocale = this.defaultLocale;
        this.localeData = {};
        this._localeToggleElement = null;
        this._boundLocaleToggle = this.toggleLocale.bind(this);
    }

    /**
     * Applies icon class, color, and localized tooltip to marker elements.
     * @param {string} className Marker class suffix (without `i-` prefix).
     * @param {string} icon Bootstrap icon class.
     * @param {string} color CSS color value.
     * @returns {void}
     */
    #insertListMarker(className, icon, color) {
        const is = document.querySelectorAll('.i-' + className);
        is.forEach(i => {
            i.title = this.getContent('icon/' + className);
            i.classList.add('bi', icon);
            i.style.color = color;
        });
    }

    /**
     * Updates document title with localized brand suffix.
     * @returns {void}
     */
    #applyBrandTitle() {
        if (document.title === '') {
            document.title = this.getContent('basic/brand');
        } else {
            document.title = document.title.split(' - ')[0] + ' - ' + this.getContent('basic/brand');
        }
    }

    /**
     * Resolves a locale to a supported locale code.
     * @param {string} locale Requested locale code.
     * @returns {string} Supported locale code.
     */
    #resolveLocale(locale) {
        if (!locale) {
            return this.defaultLocale;
        }
        const found = this.locales.find(item => item.code === locale);
        return found ? found.code : this.defaultLocale;
    }

    /**
     * Checks whether a locale is supported by current configuration.
     * @param {string} locale Locale code to check.
     * @returns {boolean} True when supported; false otherwise.
     */
    #isSupportedLocale(locale) {
        if (!locale) {
            return false;
        }
        return this.locales.some(item => item.code === locale);
    }

    /**
     * Reads locale value from URL query parameter.
     * @returns {string} Locale code from query, or empty string when missing.
     */
    #getLocaleFromQuery() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            return params.get(LOCALE_QUERY_KEY) || '';
        } catch (error) {
            return '';
        }
    }

    /**
     * Writes locale into URL query parameter without reloading the page.
     * @param {string} locale Locale code to encode in URL.
     * @returns {void}
     */
    #setLocaleQuery(locale) {
        if (!locale || !window.history || typeof window.history.replaceState !== 'function') {
            return;
        }
        try {
            const url = new URL(window.location.href);
            url.searchParams.set(LOCALE_QUERY_KEY, locale);
            window.history.replaceState(null, '', url.toString());
        } catch (error) {
            // no-op
        }
    }

    /**
     * Returns the next locale in configured locale cycle order.
     * @param {string} locale Current locale code.
     * @returns {string} Next locale code.
     */
    #getNextLocale(locale) {
        const active = this.#resolveLocale(locale);
        const idx = this.locales.findIndex(item => item.code === active);
        if (idx < 0 || this.locales.length <= 1) {
            return active;
        }
        return this.locales[(idx + 1) % this.locales.length].code;
    }

    /**
     * Updates locale switch button label to display the next locale text.
     * @param {string} activeLocale Currently active locale code.
     * @returns {void}
     */
    #updateLocaleToggleLabel(activeLocale) {
        const localeSelector = document.getElementById('localeSelector');
        if (!localeSelector) {
            return;
        }
        this.#bindLocaleToggle(localeSelector);
        const nextLocale = this.#getNextLocale(activeLocale);
        const nextLocaleConfig = this.locales.find(item => item.code === nextLocale);
        localeSelector.innerHTML = nextLocaleConfig ? nextLocaleConfig.switchLabel : nextLocale;
    }

    /**
     * Binds locale toggle click handler to selector element and replaces prior binding if needed.
     * @param {Element} localeSelector Locale toggle element.
     * @returns {void}
     */
    #bindLocaleToggle(localeSelector) {
        if (!localeSelector) {
            return;
        }
        if (this._localeToggleElement === localeSelector) {
            return;
        }
        if (this._localeToggleElement) {
            this._localeToggleElement.removeEventListener('click', this._boundLocaleToggle);
        }
        localeSelector.addEventListener('click', this._boundLocaleToggle);
        this._localeToggleElement = localeSelector;
    }

    /**
     * Fetches i18n JSON payload for a locale.
     * @param {string} locale Locale code (for example: en-US, zh-CN).
     * @returns {Promise<object>} Parsed locale dictionary.
     */
    async #fetchLocaleData(locale) {
        const response = await fetch(`${locale}.json`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch locale file: ${locale}.json (${response.status})`);
        }
        try {
            return await response.json();
        } catch (error) {
            throw new Error(`Invalid JSON in locale file: ${locale}.json`);
        }
    }

    /**
     * Resolves a slash-delimited key path from an object.
     * @param {object} root Source object.
     * @param {string} path Slash-delimited path (for example: education/phd/title).
     * @returns {*} Resolved value, or undefined if not found.
     */
    #getByPath(root, path) {
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
     * Resolves localized value by slash path from current locale dictionary.
     * @param {string} query Slash-delimited i18n key path.
     * @param {string} [defaultValue=''] Fallback value when key is missing.
     * @returns {string} Localized string or fallback value.
     */
    getContent(query, defaultValue = '') {
        const content = this.#getByPath(this.localeData, query);
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
    #renderInlineLinks(content) {
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
    #normalizeExternalLinks(root) {
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
     * Updates DOM content and image alt/title text.
     * @param {object} localeData Locale dictionary.
     * @returns {void}
     */
    #updateContent(localeData) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const keyPath = element.getAttribute('data-i18n');
            const content = this.#getByPath(localeData, keyPath);
            if (content !== undefined && content !== null) {
                element.innerHTML = this.#renderInlineLinks(content);
            }
        });
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const keyPath = element.getAttribute('data-i18n-title');
            const content = this.#getByPath(localeData, keyPath);
            if (content !== undefined && content !== null) {
                element.setAttribute('title', content);
            }
        });
        this.#normalizeExternalLinks(document);

        document.querySelectorAll('img').forEach(image => {
            const src = image.getAttribute('src');
            const altPath = src ? `alt/${src}` : '';
            const content = this.#getByPath(localeData, altPath);
            if (content !== undefined && content !== null) {
                image.setAttribute('alt', content);
                image.setAttribute('title', content);
            }
        });
    }

    /**
     * Applies post-i18n UI side effects (icon markers, document title, global getter).
     * @param {object} localeData Locale dictionary.
     * @returns {void}
     */
    #applyI18nSideEffects(localeData) {
        this.localeData = localeData || this.localeData;
        MARKER_CONFIG.forEach(marker => {
            this.#insertListMarker(marker.key, marker.icon, marker.color);
        });
        this.#applyBrandTitle();
        this.#updateLocaleToggleLabel(this.currentLocale);
    }

    /**
     * Applies resolved locale payload to state and UI, with optional persistence.
     * @param {string} locale Active locale code.
     * @param {object} localeData Resolved locale dictionary payload.
     * @param {object} options Locale application options.
     * @param {boolean} [options.persist=true] Persist locale selection in localStorage.
     * @param {boolean} [options.updateQuery=true] Update locale in URL query parameter.
     * @returns {void}
     */
    #applyLocalePayload(locale, localeData, options) {
        const persist = options.persist !== false;
        const updateQuery = options.updateQuery !== false;
        this.currentLocale = locale;
        this.localeData = localeData;
        if (persist) {
            localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        }
        if (updateQuery) {
            this.#setLocaleQuery(locale);
        }
        this.#updateContent(localeData);
        this.#applyI18nSideEffects(localeData);
        document.dispatchEvent(new CustomEvent(I18N_READY_EVENT));
    }

    /**
     * Sets a specific locale and applies localized content.
     * @param {string} locale Locale code to activate.
     * @param {object} [options] Optional behavior controls.
     * @param {boolean} [options.persist=true] Persist preference to localStorage.
     * @param {boolean} [options.updateQuery=true] Update locale query parameter.
     * @returns {Promise<void>}
     */
    async setLocale(locale, options = {}) {
        const resolvedLocale = this.#resolveLocale(locale);
        try {
            // Intentionally refetch on each locale set so updated JSON content is picked up without hard-refresh.
            const localeData = await this.#fetchLocaleData(resolvedLocale);
            this.#applyLocalePayload(resolvedLocale, localeData, options);
        } catch (error) {
            console.error(`[I18nManager] Failed to set locale "${resolvedLocale}".`, error);
            if (resolvedLocale === this.defaultLocale) {
                return;
            }
            try {
                const fallbackData = await this.#fetchLocaleData(this.defaultLocale);
                this.#applyLocalePayload(this.defaultLocale, fallbackData, options);
                console.warn(`[I18nManager] Falling back to default locale "${this.defaultLocale}".`);
            } catch (fallbackError) {
                console.error(`[I18nManager] Failed to load default locale "${this.defaultLocale}".`, fallbackError);
            }
        }
    }

    /**
     * Toggles between supported locales and refreshes localized content.
     * @param {Event} [event] Optional click event from language toggle UI.
     * @returns {Promise<void>}
     */
    async toggleLocale(event) {
        if (event) {
            event.preventDefault();
        }
        const nextLocale = this.#getNextLocale(this.currentLocale);
        await this.setLocale(nextLocale, { persist: true });
    }

    /**
     * Initializes i18n on page load.
     * @returns {Promise<void>}
     */
    async initialize() {
        const queryLocale = this.#getLocaleFromQuery();
        const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) || '';
        const initialLocale = this.#isSupportedLocale(queryLocale)
            ? queryLocale
            : (this.#isSupportedLocale(storedLocale) ? storedLocale : this.defaultLocale);
        await this.setLocale(initialLocale, { persist: false, updateQuery: true });
    }
}

window.i18nManager = new I18nManager();
window.I18N_READY_EVENT = I18N_READY_EVENT;
window.addEventListener('DOMContentLoaded', function () {
    window.i18nManager.initialize();
});
