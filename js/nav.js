class Nav extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = `
        <style>
            header.nav-row {
                background-color: #262626;
                text-align: center;
            }
        </style>
        <header class="row nav-row">
            <nav class="coffee-span-12">
                <a class="link-button nav" href="./index.html" data-i18n="menu/home"></a>
                <a class="link-button nav" href="./bio.html" data-i18n="menu/bio"></a>
                <li class="dropdown">
                    <a class="link-button nav" href="#" data-i18n="menu/research/root"></a>
                    <div class="dropdown-content">
                        <a href="./research.html#publications" data-i18n="menu/research/publication"></a>
                        <a href="./research.html#experience" data-i18n="menu/research/experience"></a>
                        <a href="./research.html#projects" data-i18n="menu/research/project"></a>
                        <a href="./research.html#ideas" data-i18n="menu/research/idea"></a>
                    </div>
                </li>
                <a class="link-button nav" href="./passions.html" data-i18n="menu/passion"></a>
                <a class="link-button nav" href="./contact.html" data-i18n="menu/contact"></a>
                <a class="link-button nav" href="#" id="lanSelector" onclick="toggleLanguage()"></a>
            </nav>
        </header>
        `
    }
}
customElements.define('nav-component', Nav);