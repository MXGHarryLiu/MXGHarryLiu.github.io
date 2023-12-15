class Footer extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = `
        <style>
            .footer {
                background-color: #262626; 
                color: #ffffff; 
                padding: 20px 0;
                text-align: center;
            }
        </style>
        <footer class="footer">
            <a class="" data-i18n="basic/copyright"></a>
        </footer>
        `
    }
}
customElements.define('footer-component', Footer);