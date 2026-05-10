class Nav extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        fetch('components/nav.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ' while loading components/nav.html');
                }
                return response.text();
            })
            .then(htmlTemplate => {
                this.innerHTML = htmlTemplate;
                const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
                this.querySelectorAll('.navbar-nav .nav-link[href]').forEach(link => {
                    const href = (link.getAttribute('href') || '').toLowerCase();
                    if (href && href !== '#' && href === currentPage) {
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'page');
                    }
                });
                document.dispatchEvent(new CustomEvent('nav-component-ready'));
                if (window.i18nManager && typeof window.i18nManager.setLocale === 'function') {
                    const manager = window.i18nManager;
                    const configuredLocales = Array.isArray(manager.locales)
                        ? manager.locales.map(locale => locale.code)
                        : [];
                    const normalizeLocale = value => {
                        if (!value || typeof value !== 'string') {
                            return '';
                        }
                        const candidate = value.trim().replace(/_/g, '-').toLowerCase();
                        const matched = configuredLocales.find(code => code.toLowerCase() === candidate);
                        return matched || '';
                    };
                    let queryLocale = '';
                    try {
                        const params = new URLSearchParams(window.location.search || '');
                        queryLocale = normalizeLocale(params.get('lang') || '');
                    } catch (error) {
                        queryLocale = '';
                    }
                    const storedLocale = normalizeLocale(localStorage.getItem('locale') || '');
                    const currentLocale = normalizeLocale(manager.currentLocale || '');
                    const defaultLocale = manager.defaultLocale || configuredLocales[0] || 'en-US';
                    const activeLocale = queryLocale || storedLocale || currentLocale || defaultLocale;
                    window.i18nManager.setLocale(activeLocale, { persist: false, updateQuery: false });
                }
            })
            .catch(error => {
                console.error('Error loading nav:', error);
            });
    }
}
customElements.define('nav-component', Nav);
