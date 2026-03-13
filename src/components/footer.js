class Footer extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        fetch('components/footer.html')
            .then(response => response.text())
            .then(htmlTemplate => {
                this.innerHTML = htmlTemplate;
                document.dispatchEvent(new CustomEvent('footer-ready'));
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }
}
customElements.define('footer-component', Footer);
