import React, { Component, Button } from "react";
import dgram from "dgram";
import "../assets/css/App.css";
import { UnmountClosed as Collapse } from "react-collapse";
import * as SessionController from "../controllers/SessionController";
import loading_svg from "../../node_modules/loading-svg/loading-balls.svg";
import ReactLoading from "react-loading";
import ClientController from "../controllers/ClientController";
import net from "net";
import Avatar from "material-ui/Avatar";
import { Notification } from "react-notification";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import TextField from "material-ui/TextField";
import ReactCSSTransitionReplace from "react-css-transition-replace";
import { List, ListItem } from "material-ui/List";
import imgur from "imgur";

// TODO: Add emoji
// TODO: Add message timestamp (collapsable on image click)
// TODO: Add validation
// TODO: Add errors
// TODO: Refactor list item into own component
// TODO: Refactor chat into own component
// TODO: Figure out transitions?

const CSS_NAME = "button button--nuka button--round-s button--text-thick";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      toggleNewToken: false,
      messages: [],
      toggleSessionToken: false,
      createSessionCSS: CSS_NAME,
      joinSessionCSS: CSS_NAME,
      randomToken: SessionController.getRandomInt(9999, 1000),
      statusMessage: "",
      messageCSS: false,
      serverAddress: "13.82.236.21",
      serverPort: 8080,
      peerImage:
        "http://www.clker.com/cliparts/v/E/3/d/S/m/silhouette-male-grey-hi.png",
      userImage:
        "https://www.materialui.co/materialIcons/file/cloud_upload_grey_192x192.png"
    };

    this.udpSocket = dgram.createSocket("udp4");

    this.setMessage = this.setMessage.bind(this);
    this.onRandomTokenToggle = this.onRandomTokenToggle.bind(this);
    this.onSessionTokenToggle = this.onSessionTokenToggle.bind(this);
    this.setServerIp = this.setServerIp.bind(this);
    this.setPeerImage = this.setPeerImage.bind(this);
    this.addNewMessage = this.addNewMessage.bind(this);

    this.clientController = new ClientController(
      this.state.serverAddress,
      this.state.serverPort,
      this.setMessage,
      this.setPeerImage,
      this.addNewMessage
    );
  }

  componentDidMount() {
    // TODO: Add fade in, fade out
    // TODO: Perhaps, if time, refactor loading message into own component
    // TODO: Disable create session and join session buttons
    this.clientController.avatar = this.state.peerImage;
    document.title = "Amigo-2-Amigo";
  }

  setMessage(message) {
    this.setState({
      statusMessage: message
    });
  }

  setPeerImage(image) {
    this.setState({ peerImage: image ? image : this.state.peerImage });
  }

  addNewMessage(message) {
    this.setState({ messages: [...this.state.messages, message] });
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
      this.clientController.udpSocket.close();
    }
  }

  startSession(randomBuff) {
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
      this.setState({ userImage: reader.result });

      imgur.setClientId("7617bc3b7e87043");

      imgur
        .uploadFile(file.path)
        .then(json => {
          console.log(json.data.link);
          this.clientController.avatar = json.data.link;
        })
        .catch(function(err) {
          console.error(err.message);
        });
    };
    reader.readAsDataURL(file);
  }

  render() {
    const messageItems = () => {
      this.state.messages.map(message => {
        if (message.type === "OWN") {
          return (
            <div className="my-message">
              <Avatar
                size={70}
                src={this.state.userImage}
                className={"img-circle"}
              />

              <div className="chat-bubble left">
                <p className="m-b-0">{message.body}</p>
              </div>
            </div>
          );
        }

        return (
          <div className="peer-message">
            <Avatar
              size={70}
              src={this.state.peerImage}
              className={"img-circle-peer"}
            />{" "}
            <div className="chat-bubble right">
              <p className="m-b-0">{message.body}</p>
            </div>
          </div>
        );
      });
    };

    const { statusMessage } = this.state;

    return (
      <div className="main">
        {statusMessage !== "Connected to peer" && (
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
                  {this.state.statusMessage &&
                    this.state.statusMessage !==
                      "Other client disconnected" && (
                      <ReactLoading type={"bubbles"} />
                    )}

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
                      placeholder="4 Digit Token ID"
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
                      placeholder="4 Digit Token ID"
                    />
                  </div>
                </Collapse>
              </div>
            </div>
          </div>
        )}
        {statusMessage === "Connected to peer" && (
          // TODO: Figure out this stupid transition
          <div className={"conversation-holder"}>
            <div className="chat-wrapper">
              <MuiThemeProvider>
                <div>
                  {this.state.messages.map(message => {
                    if (message.type === "OWN") {
                      return (
                        <div className="my-message">
                          <Avatar
                            size={60}
                            src={this.state.userImage}
                            className={"img-circle"}
                          />

                          <div className="chat-bubble left">
                            <p className="m-b-0">{message.body}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="peer-message">
                        <Avatar
                          size={60}
                          src={this.state.peerImage}
                          className={"img-circle-peer"}
                        />{" "}
                        <div className="chat-bubble right">
                          <p className="m-b-0">{message.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </MuiThemeProvider>
            </div>
            <div class="cover-bar" />

            <div className={"input-holder"}>
              <span class="chat-input">
                <input
                  ref="chatInput"
                  placeholder={"Enter text"}
                  className={"chat-text-input"}
                  type="text"
                  onKeyPress={e => {
                    if (e.key === "Enter") {
                      if (e.target.value) {
                        this.clientController.msgUpdate(e.target.value);

                        this.addNewMessage({
                          type: "OWN",
                          body: e.target.value
                        });

                        this.refs.chatInput.value = "";
                      }
                    }
                  }}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const header = () => {
  return (
    <div className="header">
      <div style={{ display: "inline-block" }}>
        <h1 style={{ display: "inline-block", color: "#7986cb" }}>/&nbsp;</h1>
        <h1 style={{ display: "inline-block" }}>Amigo-</h1>
        <h1 style={{ display: "inline-block", color: "#7986cb" }}>2</h1>
        <h1 style={{ display: "inline-block" }}>-Amigo</h1>
        <h1 style={{ display: "inline-block", color: "#7986cb" }}>&nbsp;/</h1>
      </div>
      <h4>A peer-to-peer chat client featuring NAT traversal and encryption</h4>
    </div>
  );
};

export default App;
