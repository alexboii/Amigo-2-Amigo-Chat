import filippo_image from "../assets/images/filippo_image.jpg";
import React, { Component, Button } from "react";
import dgram from "dgram";
import "../assets/css/App.css";
import { UnmountClosed as Collapse } from "react-collapse";
import * as SessionController from "../controllers/SessionController";
import loading_svg from "../../node_modules/loading-svg/loading-balls.svg";
import ReactLoading from "react-loading";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { CSSTransitionGroup } from "react-transition-group"; // ES6
import ClientController from "../controllers/ClientController";

const CSS_NAME = "button button--nuka button--round-s button--text-thick";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toggleNewToken: false,
      createSessionCSS: CSS_NAME,
      randomToken: SessionController.getRandomInt(9999, 1000),
      statusMessage: "",
      messageCSS: false,
      serverAddress: "13.82.236.21",
      serverPort: 8080
    };

    this.udpSocket = dgram.createSocket("udp4");

    this.setMessage = this.setMessage.bind(this);
    this.onRandomTockenToggle = this.onRandomTockenToggle.bind(this);
    this.setServerIp = this.setServerIp.bind(this);

    this.clientController = new ClientController(
      this.state.serverAddress,
      this.state.serverPort,
      this.setMessage
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
    if (!this.validateServerAddress()) {
      this.setMessage("Invalid server address");
      return;
    }

    this.toggleMessageVisibility("SHOW");

    this.setState({ toggleNewToken: !this.state.toggleNewToken });

    this.setState({
      createSessionCSS: !this.state.toggleNewToken
        ? CSS_NAME + " active"
        : CSS_NAME
    });

    this.serverAddress;

    const randomBuff = SessionController.getRandomInt(9999, 1000);

    if (!this.state.toggleNewToken) {
      this.setState({
        randomToken: randomBuff
      });
    }

    this.clientController.serverAddress = this.state.serverAddress;
    this.clientController.serverPort = parseInt(this.state.serverPort);

    this.clientController.startSocketListeners(this.udpSocket, randomBuff);
  }

  validateServerAddress() {
    console.log(`${this.state.serverAddress}:${this.state.serverPort}`);

    return /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/.test(
      `${this.state.serverAddress}:${this.state.serverPort}`
    );
  }

  setServerIp(e) {
    const addressBuffer = e.target.value.split(":");

    console.log(addressBuffer);

    this.setState({
      serverAddress: addressBuffer[0],
      serverPort: addressBuffer[1]
    });
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
          <input
            value={this.state.serverAddress + ":" + this.state.serverPort}
            type="text"
            placeholder="Server Address & Port"
            onChange={this.setServerIp}
          />
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
