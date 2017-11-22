import dgram from "dgram";
import net from "net";

class ClientController {
  constructor(
    serverAddress,
    serverPort,
    statusCallback,
    peerImageCallback,
    addMessageCallback
  ) {
    this._serverAddress = serverAddress;
    this._serverPort = serverPort;
    this._udpSocket;
    this.statusCallback = statusCallback;
    this.peerImageCallback = peerImageCallback;
    this.addMessageCallback = addMessageCallback;

    this.rngId = 0;
    this.timeoutHandle;
    this.ackd = false;
    this.serverAck = false;

    this.selfAddress;
    this.selfPort;

    this._name;
    this._avatar;
    this._peerName;
    this._peerAvatar;

    this.peerAddress;
    this.peerPort;

    this.randomToken;
  }

  startSocketListeners(socket, randomToken) {
    console.log("Am I here");

    this._udpSocket = socket;

    console.log(this.statusCallback);

    this._udpSocket.on("error", err => {
      this.statusCallback(`client error:\n${err.stack}`);
      this._udpSocket.close();
    });

    this._udpSocket.on("message", (msg, rinfo) => {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        this.statusCallback(`! Couldn\'t parse message ${e} :\n`);
        return;
      }

      console.log(rinfo.address);

      switch (msg.type) {
        case "ACK":
          if (msg.peer_ip) {
            //Message from server
            this.serverAck = true;
            this.connectToPeer(msg.peer_ip, msg.peer_port);
          } else if (
            rinfo.address !== this._serverAddress ||
            rinfo.port !== this._serverPort
          ) {
            this._peerName = msg.peer_name;
            this.peerImageCallback(msg.peer_avatar);
            this._peerAvatar = msg.peer_avatar;
            //If we receive an ACK from the other client, then we know we've successfullserverTimey kept the UDP NAT hole punch open
            this.ackd = this.notifyAck(msg.id);
            //Make keep alive function go back to sleep
          } else {
            //ACK from server
            this.serverAck = true;
          }

          break;
        case "CON":
          this.connectToPeer(msg.peer_ip, msg.peer_port);
          break;
        case "MSG":
          // this.statusCallback(`${msg.peer_name}: ${msg.msg}`);
          this.addMessageCallback({ type: "PEER", body: msg.msg });

          break;
        case "SYN":
          //Acknowledge the keep alive signal
          const ackSYN = {
            type: "ACK",
            source_ip: this.selfAddress,
            source_port: this.selfPort,
            id: msg.id + 1,
            peer_name: this._name,
            peer_avatar: this._avatar
          };
          this._udpSocket.send(
            Buffer.from(JSON.stringify(ackSYN)),
            this.peerPort,
            this.peerAddress
          );
          break;
      }
    });

    console.log(randomToken);
    this._udpSocket.on("listening", () => this.listening(randomToken, this));

    try {
      this._udpSocket.bind();
      console.log(this._udpSocket);
      this.statusCallback("here");
    } catch (e) {
      console.log("here");
      this.statusCallback("error");
    }
  }

  listening(randomToken, self) {
    var msg = { type: "REQ", msg: randomToken };
    let attempts = 1;
    console.log("bro");
    this._udpSocket.send(
      Buffer.from(JSON.stringify(msg)),
      this._serverPort,
      this._serverAddress
    );
    this.serverTimeout = setInterval(() => {
      if (attempts > 3) {
        this.statusCallback("Could not contact server");
      } else if (!this.serverAck) {
        this.statusCallback(
          `Attempting to contact server (Attempt ${attempts})`
        );
        var syn_msg = { type: "SYN", id: this.rngId };
        this._udpSocket.send(
          Buffer.from(JSON.stringify(msg)),
          this._serverPort,
          this._serverAddress
        );
      } else {
        this.statusCallback("Waiting for matchmaking");
        this.serverAck = false;
        clearInterval(this.serverTimeout);
      }
      attempts++;
    }, 3000);
  }

  startListening(randomToken, newSocket) {
    console.log("state");

    this.randomToken = randomToken;
    console.log(this._udpSocket);

    let test = caller => {
      this.listening(randomToken, this);
    };

    console.log(newSocket);

    try {
      // TODO: Figure out why this doesn't work
      newSocket.bind(() => {
        this.listening(randomToken, newSocket);
      });
    } catch (e) {}
  }

  connectToPeer(address, port) {
    this.statusCallback(`Connecting to peer ${address}:${port}`);

    this.keepAlive();

    this.peerAddress = address;
    this.peerPort = port;

    console.log(this.peerPort, port);

    let attempts = 0;
    this.ackd = false;
    this.rngId = Math.floor(Math.random() * 1000);

    let initConnect = setInterval(() => {
      if (++attempts > 3) {
        this.statusCallback("Could not connect to peer");
      } else if (!this.ackd) {
        var syn_msg = { type: "SYN", id: this.rngId };
        this._udpSocket.send(
          Buffer.from(JSON.stringify(syn_msg)),
          this.peerPort,
          this.peerAddress
        );
      } else {
        clearInterval(initConnect);
        this.statusCallback("Connected to peer");
        //Once we've established a reliable UDP connection, we can start messaging
      }
    }, 3000);
  }

  msgUpdate(message) {
    // TODO: Log the answer in a database
    this._udpSocket.send(
      Buffer.from(JSON.stringify({ type: "MSG", msg: message })),
      this.peerPort,
      this.peerAddress
    );
  }

  keepAlive() {
    if (this.timeoutHandle) {
      clearInterval(this.timeoutHandle);
    }

    this.rngId = Math.floor(Math.random() * 1000);
    var syn_msg = { type: "SYN", id: this.rngId };
    let attempts = 1;
    this.timeoutHandle = setInterval(() => {
      if (attempts > 3) {
        this.statusCallback("Other client disconnected");
      }

      this._udpSocket.send(
        Buffer.from(JSON.stringify(syn_msg)),
        this.peerPort,
        this.peerAddress
      );

      attempts++;
    }, 1000);
  }

  notifyAck(id) {
    if (id != this.rngId + 1) {
      return false;
    }

    //This stops a thing from repeating
    if (this.timeoutHandle) {
      clearInterval(this.timeoutHandle);
    }

    this.timeoutHandle = setInterval(() => {
      this.keepAlive();
    }, 15000);

    return true;
  }

  set serverAddress(newAddress) {
    this._serverAddress = newAddress;
  }

  get serverAddress() {
    return this._serverAddress;
  }

  set serverPort(newPort) {
    this._serverPort = newPort;
  }

  get serverAddress() {
    return this._serverPort;
  }

  set name(newName) {
    this._name = newName;
  }

  set avatar(newAvatar) {
    this._avatar = newAvatar;
  }

  set peerName(newName) {
    this._peerName = newName;
  }

  set peerAvatar(newAvatar) {
    this._peerAvatar = newAvatar;
  }

  get udpSocket() {
    return this._udpSocket;
  }

  set udpSocket(newUdpSocket) {
    this._udpSocket = newUdpSocket;
  }
}

export default ClientController;
