import filippo_image from "../assets/images/filippo_image.jpg";
import React, { Component, Button } from "react";
import "../assets/css/App.css";
import { UnmountClosed as Collapse } from "react-collapse";
import * as SessionController from "../controllers/SessionController";

const CSS_NAME = "button button--nuka button--round-s button--text-thick";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toggleNewToken: false,
      createSessionCSS: CSS_NAME,
      randomToken: SessionController.getRandomInt(9999, 0)
    };
  }

  render() {
    return (
      <div className="main">
        {header()}
        <div className="server-address-holder">
          <input type="text" placeholder="Server Address & Port" />
        </div>
        <div className="session-holder">
          <div className="button-holder">
            <button
              className={this.state.createSessionCSS}
              onClick={() => {
                this.setState({ toggleNewToken: !this.state.toggleNewToken });

                this.setState({
                  createSessionCSS: !this.state.toggleNewToken
                    ? CSS_NAME + " active"
                    : CSS_NAME
                });

                if (!this.state.toggleNewToken) {
                  this.setState({
                    randomToken: SessionController.getRandomInt(9999, 1000)
                  });
                }
              }}
            >
              Create Session
            </button>
            <button className="button button--nuka button--round-s button--text-thick">
              Join Session
            </button>
          </div>
          <div className="token-holder">
            <Collapse isOpened={this.state.toggleNewToken}>
              <div className="token-holder">
                <input
                  type="text"
                  value={this.state.randomToken}
                  placeholder="Token ID"
                />
              </div>
            </Collapse>
          </div>
        </div>
      </div>
    );
  }
}

function header() {
  return (
    <div className="header">
      <h1>Philippo-2-Philippo Chat</h1>
      <img className="img-circle" src={filippo_image} />
      <h4>A peer-to-peer chat client featuring NAT traversal and encryption</h4>
    </div>
  );
}

export default App;
