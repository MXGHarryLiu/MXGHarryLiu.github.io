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
                <a class="plain-text footer">Copyright &copy; 2016 - 2023 Zhuohe Liu</a>
                <a class="link-text footer-link" href="/zh-CN/index.html" title="">中文</a>
            </div>
        </footer>
        `
    }
}
customElements.define('footer-component', Footer);