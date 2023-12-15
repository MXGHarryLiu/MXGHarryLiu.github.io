class Nav extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        fetch('components/nav.html')
            .then(response => response.text())
            .then(htmlTemplate => {
                this.innerHTML = htmlTemplate;
            })
            .catch(error => {
                console.error('Error loading nav:', error);
            });
    }
}
customElements.define('nav-component', Nav);