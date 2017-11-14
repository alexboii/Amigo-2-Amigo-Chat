import filippo_image from "../assets/images/filippo_image.jpg";
import React, { Component, Button } from "react";
import "../assets/css/App.css";

class App extends Component {
  render() {
    return (
      <div class="main">
        <div class="header">
          <h1>Philippo-2-Philippo Chat</h1>
          <img class="img-circle" src={filippo_image} />
          <h4>
            A peer-to-peer chat client featuring NAT traversal and encryption.
          </h4>
        </div>
        <div class="server-address-holder">
          <input type="text" placeholder="Server Address & Port" />
        </div>
        <div class="button-holder">
          <button class="button button--nuka button--round-s button--text-thick">
            Create Session
          </button>
          <button class="button button--nuka button--round-s button--text-thick">
            Join Session
          </button>
        </div>
      </div>
    );
  }
}

export default App;
