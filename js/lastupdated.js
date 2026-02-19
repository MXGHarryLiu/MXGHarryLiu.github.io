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
      const spanElement = document.getElementById("lastupdated");
      if (spanElement) {
          spanElement.innerHTML = `${this.getLabel()}${this.date.slice(0, 10)}`;
      }
  }
};
latestCommitComponent.fetchData();
document.addEventListener(window.I18N_READY_EVENT || "i18n-ready", function () {
  latestCommitComponent.render();
});
