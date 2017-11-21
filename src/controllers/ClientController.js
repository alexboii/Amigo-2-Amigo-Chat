import dgram from "dgram";
import net from "net";

class ClientController {
  constructor(serverAddress, serverPort, statusCallback, udpSocket) {
    this.serverAddress = serverAddress;
    this.serverPort = serverPort;
    this.statusCallback = statusCallback;

    this.rngId = 0;
    this.timeoutHandle;
    this.ackd = false;
    this.serverAck = false;

    this.selfAddress;
    this.selfPort;

    this.udpSocket = udpSocket;

    this.peerAddress;
    this.peerPort;

    this.randomToken;
  }

  startSocketListeners() {
    console.log("Am I here");

    console.log(this.statusCallback);

    this.udpSocket.on("error", err => {
      this.statusCallback(`client error:\n${err.stack}`);
      this.udpSocket.close();
    });

    this.udpSocket.on("message", (msg, rinfo) => {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        this.statusCallback(`! Couldn\'t parse message ${e} :\n`);
        return;
      }
      switch (msg.type) {
        case "ACK":
          if (msg.peer_ip) {
            //Message from server
            this.serverAck = true;
            this.connectToPeer(msg.peer_ip, msg.peer_port);
          } else if (
            msg.source_ip != this.serverAddress ||
            msg.source_port != this.serverPort
          ) {
            //If we receive an ACK from the other client, then we know we've successfullserverTimey kept the UDP NAT hole punch open
            this.ackd = notifyAck(msg.id);
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
          this.statusCallback(`Received: ${msg.msg}`);
          msgUpdate();
          break;
        case "SYN":
          //Acknowledge the keep alive signal
          const ackSYN = {
            type: "ACK",
            source_ip: this.selfAddress,
            source_port: this.selfPort,
            id: msg.id + 1
          };
          this.udpSocket.send(
            Buffer.from(JSON.stringify(ackSYN)),
            this.peerPort,
            this.peerAddress
          );
          break;
      }
    });

    this.udpSocket.on("listening", () => {
      var msg = { type: "REQ", msg: 495 };
      let attempts = 1;
      console.log("bro");
      console.debug();
      this.udpSocket.send(
        Buffer.from(JSON.stringify(msg)),
        this.serverPort,
        this.serverAddress
      );
      this.serverTimeout = setInterval(() => {
        if (attempts > 3) {
          this.statusCallback("Could not contact server");
        } else if (!this.serverAck) {
          this.statusCallback(
            `Attempting to contact server (Attempt ${attempts})`
          );
          var syn_msg = { type: "SYN", id: this.rngId };
          this.udpSocket.send(
            Buffer.from(JSON.stringify(msg)),
            this.serverPort,
            this.serverAddress
          );
        } else {
          this.statusCallback("Waiting for matchmaking");
          this.serverAck = false;
          clearInterval(this.serverTimeout);
        }
        attempts++;
      }, 3000);
    });

    try {
      this.udpSocket.bind();
      console.log(this.udpSocket);
      this.statusCallback("here");
    } catch (e) {
      console.log("here");
      this.statusCallback("error");
    }
  }

  listening(randomToken, self) {
    var msg = { type: "REQ", msg: this.randomToken };
    let attempts = 1;
    console.log("bro");
    console.debug();
    this.udpSocket.send(
      Buffer.from(JSON.stringify(msg)),
      this.serverPort,
      this.serverAddress
    );
    this.serverTimeout = setInterval(() => {
      if (attempts > 3) {
        this.statusCallback("Could not contact server");
      } else if (!this.serverAck) {
        this.statusCallback(
          `Attempting to contact server (Attempt ${attempts})`
        );
        var syn_msg = { type: "SYN", id: this.rngId };
        this.udpSocket.send(
          Buffer.from(JSON.stringify(msg)),
          this.serverPort,
          this.serverAddress
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
    console.log(this.udpSocket);

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

    keepAlive();

    this.peerAddress = address;
    this.peerPort = port;

    let attempts = 0;
    this.ackd = false;
    this.rngId = Math.floor(Math.random() * 1000);

    let initConnect = setInterval(() => {
      if (++attempts > 3) {
        this.statusCallback("Could not connect to peer");
      } else if (!this.ackd) {
        var syn_msg = { type: "SYN", id: this.rngId };
        this.udpSocket.send(
          Buffer.from(JSON.stringify(syn_msg)),
          this.peerPort,
          this.peerAddress
        );
      } else {
        clearInterval(initConnect);
        //Once we've established a reliable UDP connection, we can start messaging
        msgUpdate();
      }
    }, 3000);
  }

  msgUpdate() {
    rl.question(">", answer => {
      // TODO: Log the answer in a database
      var msg = { type: "MSG", msg: answer };
      this.udpSocket.send(
        Buffer.from(JSON.stringify(msg)),
        peer_port,
        peer_address
      );
      msgUpdate();
    });
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

      this.udpSocket.send(
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
      keepAlive();
    }, 15000);

    return true;
  }
}

export default ClientController;
