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
import net from "net";
import Avatar from "material-ui/Avatar";
import { Notification } from "react-notification";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import TextField from "material-ui/TextField";
import ReactCSSTransitionReplace from "react-css-transition-replace";

const CSS_NAME = "button button--nuka button--round-s button--text-thick";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toggleNewToken: false,
      toggleSessionToken: false,
      createSessionCSS: CSS_NAME,
      joinSessionCSS: CSS_NAME,
      randomToken: SessionController.getRandomInt(9999, 1000),
      statusMessage: "",
      messageCSS: false,
      serverAddress: "13.82.236.21",
      serverPort: 8080,
      userImage:
        "https://www.materialui.co/materialIcons/file/cloud_upload_grey_192x192.png"
    };

    this.udpSocket = dgram.createSocket("udp4");

    this.setMessage = this.setMessage.bind(this);
    this.onRandomTokenToggle = this.onRandomTokenToggle.bind(this);
    this.onSessionTokenToggle = this.onSessionTokenToggle.bind(this);
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
    this.toggleMessageVisibility("HIDE");
  }

  setMessage(message) {
    this.setState({
      statusMessage: message
    });
  }

  toggleMessageVisibility(visibility) {
    this.setState({ messageCSS: false });
  }

  onSessionTokenToggle() {
    if (this.state.toggleNewToken) {
      this.setState({
        createSessionCSS: !this.state.toggleNewToken
          ? CSS_NAME + " active"
          : CSS_NAME
      });
      setTimeout(
        () =>
          this.setState({
            toggleNewToken: false
          }),
        1000
      );
    }

    this.setState({
      toggleSessionToken: !this.state.toggleSessionToken,
      joinSessionCSS: !this.state.toggleSessionToken
        ? CSS_NAME + " active"
        : CSS_NAME
    });
  }

  onRandomTokenToggle() {
    if (!this.validateServerAddress()) {
      this.setMessage("Invalid server address");
      return;
    }

    this.toggleMessageVisibility("SHOW");

    if (this.state.toggleSessionToken) {
      this.setState({
        joinSessionCSS: !this.state.toggleSessionToken
          ? CSS_NAME + " active"
          : CSS_NAME
      });

      setTimeout(
        () =>
          this.setState({
            toggleSessionToken: false
          }),
        1000
      );
    }

    this.setState({
      toggleNewToken: !this.state.toggleNewToken,
      createSessionCSS: !this.state.toggleNewToken
        ? CSS_NAME + " active"
        : CSS_NAME
    });

    const randomBuff = SessionController.getRandomInt(9999, 1000);

    if (!this.state.toggleNewToken) {
      console.log("when");
      this.setState({
        randomToken: randomBuff
      });

      this.startSession(randomBuff);
    } else {
      // TODO: Fix this whole double click on "create session" thing
      this.clientController.udpSocket.close();
    }
  }

  startSession(randomBuff) {
    console.log("am i here?");

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

  encodeImageFileAsURL(element) {
    var file = element.files[0];
    var reader = new FileReader();
    reader.onloadend = () => {
      console.log("RESULT", reader.result);
      this.setState({ userImage: reader.result });
    };
    reader.readAsDataURL(file);
  }

  render() {
    return (
      <div className="main">
        {this.state.statusMessage !== "Connected to peer" && (
          <div className="main" key="login">
            {header()}
            <div className="server-address-holder">
              <div className="loader">
                <div className="file-user-holder">
                  <div className="image-upload">
                    <label for="file-input">
                      <MuiThemeProvider>
                        <Avatar
                          size={80}
                          src={this.state.userImage}
                          className={"img-circle"}
                        />
                      </MuiThemeProvider>
                    </label>

                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={e => this.encodeImageFileAsURL(e.target)}
                    />
                    <MuiThemeProvider>
                      <TextField
                        hintStyle={{ color: "#808080" }}
                        floatingLabelFocusStyle={{ color: "#4FC3F7" }}
                        floatingLabelStyle={{ color: "#C7C7CD" }}
                        inputStyle={{ color: "#ffffff" }}
                        floatingLabelText="Username"
                        onChange={e => {
                          console.log("bruh");
                          this.clientController.name = e.target.value;
                        }}
                      />
                    </MuiThemeProvider>
                  </div>
                </div>
                <ReactCSSTransitionReplace
                  transitionName="cross-fade"
                  transitionEnterTimeout={1000}
                  transitionLeaveTimeout={1000}
                >
                  <span>{this.state.statusMessage}</span>

                  {/* <div className={"status-message"}>
                <ReactLoading type={"bubbles"} />
                <span textColor={"#50C878"}>{this.state.statusMessage}</span>
              </div> */}
                </ReactCSSTransitionReplace>
              </div>
              <input
                value={this.state.serverAddress + ":" + this.state.serverPort}
                className={"input-box"}
                hintStyle={{ color: "white" }}
                type="text"
                placeholder="Server Address & Port"
                onChange={this.setServerIp}
              />
            </div>
            <div className="session-holder">
              <div className="button-holder">
                <button
                  className={this.state.createSessionCSS}
                  onClick={this.onRandomTokenToggle}
                >
                  Create Session
                </button>
                <button
                  className={this.state.joinSessionCSS}
                  onClick={this.onSessionTokenToggle}
                >
                  Join Session
                </button>
              </div>
              <div className="token-holder">
                <Collapse
                  isOpened={
                    this.state.toggleNewToken && !this.state.toggleSessionToken
                  }
                >
                  <div className="token-holder">
                    <input
                      className={"input-box"}
                      type="text"
                      value={this.state.randomToken}
                      placeholder="Token ID"
                    />
                  </div>
                </Collapse>
                <Collapse
                  isOpened={
                    !this.state.toggleNewToken && this.state.toggleSessionToken
                  }
                >
                  <div className="token-holder">
                    <input
                      className={"input-box"}
                      onChange={e => {
                        // TODO: Change to on submit
                        if (e.target.value.length === 4) {
                          this.startSession(e.target.value);
                        }
                      }}
                      type="text"
                      placeholder="Token ID"
                    />
                  </div>
                </Collapse>
              </div>
            </div>
          </div>
        )}

        {this.state.statusMessage === "Connected to peer" && (
          // TODO: Figure out this stupid transition
          <ReactCSSTransitionGroup
            component="div"
            className="cross-fade"
            transitionName="cross-fade"
            transitionEnter={true}
            transitionEnterTimeout={1000}
            transitionLeave={true}
            transitionLeaveTimeout={1000}
          >
            <div key="cross-fade"> test </div>
          </ReactCSSTransitionGroup>
        )}
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
