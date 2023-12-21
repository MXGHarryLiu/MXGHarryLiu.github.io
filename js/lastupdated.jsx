/**
  https://stackoverflow.com/questions/29845346/how-to-get-latest-commit-date-github-api
 */
class LatestCommitComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = {date: ""};
    }
  
    componentDidMount() {
      fetch("https://api.github.com/repos/MXGHarryLiu/MXGHarryLiu.github.io/branches/main")
        .then(response => {
          response.json().then(json => {
            console.log(json);
            this.setState({date: json.commit.commit.author.date});
          });
        })
        .catch(error => {
          console.log(error);
        });
    }
  
    render() {
      return (
        <span>Last updated: {this.state.date.slice(0, 10)}</span>
      );
    }
  }
  
  ReactDOM.render(<LatestCommitComponent/>, document.getElementById("lastupdated"));