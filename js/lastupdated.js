const latestCommitComponent = {
  date: "",
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
          spanElement.innerHTML = `Last updated: ${this.date.slice(0, 10)}`;
      }
  }
};
latestCommitComponent.fetchData();