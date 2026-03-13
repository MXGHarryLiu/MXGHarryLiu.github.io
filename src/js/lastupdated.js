const latestCommitComponent = {
  date: "",
  getLabel: function () {
      if (window.i18nManager && typeof window.i18nManager.getContent === "function") {
          return window.i18nManager.getContent("basic/lastUpdated", "Last updated: ");
      }
      return "Last updated: ";
  },
  fetchData: function () {
      fetch("https://api.github.com/repos/MXGHarryLiu/MXGHarryLiu.github.io/branches/main")
          .then(response => {
              response.json().then(json => {
                  this.date = json.commit.commit.author.date;
                  this.render();
              });
          })
          .catch(error => {
              console.log(error);
          });
  },
  render: function () {
      const wrapperElement = document.getElementById("footer-lastupdated");
      const dateElement = document.getElementById("footer-lastupdated-date");
      if (wrapperElement && dateElement) {
          const displayDate = this.date ? this.date.slice(0, 10) : "xxxx-xx-xx";
          const tooltipLabel = this.getLabel().trim();
          dateElement.textContent = displayDate;
          wrapperElement.title = tooltipLabel;
          wrapperElement.setAttribute("aria-label", tooltipLabel);
      }
  }
};
latestCommitComponent.fetchData();
document.addEventListener("footer-ready", function () {
  latestCommitComponent.render();
});
document.addEventListener(window.I18N_READY_EVENT || "i18n-ready", function () {
  latestCommitComponent.render();
});
