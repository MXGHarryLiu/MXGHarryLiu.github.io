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
                document.dispatchEvent(new CustomEvent('nav-component-ready'));
                if (window.i18nManager && typeof window.i18nManager.setLocale === 'function') {
                    const activeLocale = window.i18nManager.currentLocale || 'en-US';
                    window.i18nManager.setLocale(activeLocale, { persist: false, updateQuery: false });
                }
            })
            .catch(error => {
                console.error('Error loading nav:', error);
            });
    }
}
customElements.define('nav-component', Nav);
