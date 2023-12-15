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
                padding: 10px;
            }

            .navbar-dark .navbar-brand {
                font-size: 18px;
            }

            .navbar-dark .navbar-nav .nav-link {
                color: #ffffff; 
                font-size: 16px;
            }

            .navbar-dark .navbar-toggler-icon {
                background-color: #262626; 
            }
        </style>
        <header class="navbar navbar-expand-sm navbar-dark bg-dark">
            <a class="navbar-brand" data-i18n="basic/brand" href="./index.html"></a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="./bio.html" data-i18n="menu/bio"></a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-i18n="menu/research/root" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></a>
                        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                            <a class="dropdown-item" href="./publication.html" data-i18n="menu/research/publication"></a>
                            <a class="dropdown-item" href="./research.html#experience" data-i18n="menu/research/experience"></a>
                            <a class="dropdown-item" href="./research.html#projects" data-i18n="menu/research/project"></a>
                            <a class="dropdown-item" href="./ideas.html" data-i18n="menu/research/idea"></a>
                        </div>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="./passions.html" data-i18n="menu/passion"></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="./contact.html" data-i18n="menu/contact"></a>
                    </li>
                </ul>
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#" id="lanSelector" onclick="toggleLanguage()"></a>
                    </li>
                </ul>
            </div>
        </header>
        `
    }
}
customElements.define('nav-component', Nav);