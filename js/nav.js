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
                <a class="link-button nav" href="index.html" data-i18n="menu/home"></a>
                <a class="link-button nav" href="bio.html" data-i18n="bio/title"></a>
                <li class="dropdown">
                    <a class="link-button nav" href="#" data-i18n="menu/research/root"></a>
                    <div class="dropdown-content">
                        <a href="publication.html" data-i18n="publication/title"></a>
                        <a href="experience.html" data-i18n="experience/title"></a>
                        <a href="project.html" data-i18n="project/title"></a>
                        <a href="ideas.html" data-i18n="idea/title"></a>
                    </div>
                </li>
                <a class="link-button nav" href="passion.html" data-i18n="passion/title"></a>
                <a class="link-button nav" href="#" id="lanSelector" onclick="toggleLanguage()"></a>
            </nav>
        </header>
        `
    }
}
customElements.define('nav-component', Nav);