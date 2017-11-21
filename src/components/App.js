import filippo_image from "../assets/images/filippo_image.jpg";
import React, { Component, Button } from "react";
import "../assets/css/App.css";
import { UnmountClosed as Collapse } from "react-collapse";
import * as SessionController from "../controllers/SessionController";
import loading_svg from "../../node_modules/loading-svg/loading-balls.svg";
import ReactLoading from "react-loading";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { CSSTransitionGroup } from "react-transition-group"; // ES6
import ClientController from "../controllers/ClientController";
import dgram from "dgram";
import net from "net";

const CSS_NAME = "button button--nuka button--round-s button--text-thick";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toggleNewToken: false,
      createSessionCSS: CSS_NAME,
      randomToken: SessionController.getRandomInt(9999, 1000),
      statusMessage: "",
      messageCSS: false
    };

    this.setMessage = this.setMessage.bind(this);
    this.onRandomTockenToggle = this.onRandomTockenToggle.bind(this);
    this.udpSocket = dgram.createSocket("udp4");

    this.clientController = new ClientController(
      "13.82.236.21",
      8080,
      this.setMessage,
      this.udpSocket
    );
  }

  componentDidMount() {
    // TODO: Add fade in, fade out
    // TODO: Perhaps, if time, refactor loading message into own component
    // TODO: Disable create session and join session buttons
    this.setMessage("Attempting to connect to server");

    this.toggleMessageVisibility("SHOW");
  }

  setMessage(message) {
    this.setState({ statusMessage: message });
  }

  toggleMessageVisibility(visibility) {
    this.setState({ messageCSS: true });
  }

  onRandomTockenToggle() {
    this.toggleMessageVisibility("SHOW");

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

    this.clientController.startSocketListeners();
  }

  render() {
    return (
      <div className="main">
        {header()}
        <div className="server-address-holder">
          <div className="loader">
            <ReactLoading type={"bubbles"} />
            <CSSTransitionGroup
              transitionName="example"
              transitionEnterTimeout={500}
              transitionLeaveTimeout={300}
            >
              <span textColor={"#50C878"}>{this.state.statusMessage}</span>
            </CSSTransitionGroup>
          </div>
          <input type="text" placeholder="Server Address & Port" />
        </div>
        <div className="session-holder">
          <div className="button-holder">
            <button
              className={this.state.createSessionCSS}
              onClick={this.onRandomTockenToggle}
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
      <h4>A peer-to-peer chat client featuring NAT traversal and encryption</h4>
    </div>
  );
}

export default App;
