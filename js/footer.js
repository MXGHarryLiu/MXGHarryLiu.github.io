class Footer extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = `
        <style>
            footer{
                text-align: center;
            }
        </style>
        <footer class="row footer-row">
            <div class="coffee-span-12 footer-column">
                <div class="rule">
                    <hr>
                </div>
                <a class="plain-text footer" data-i18n="copyright"></a>
            </div>
        </footer>
        `
    }
}
customElements.define('footer-component', Footer);