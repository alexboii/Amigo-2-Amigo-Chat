//UDP
const dgram = require("dgram");
//TCP
const net = require("net");
//Command line input
const readline = require("readline");

//Address of matchmaking/STUN server
const SERVER_ADDRESS = "13.82.236.21";
const SERVER_PORT = 8080;

//UDP socket used for communicating with server and keeping router hole open
var udp_socket = dgram.createSocket("udp4");

//TEMPORARY READLINE INTERFACE FOR MESSAGIN
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//Used for keep alive function
let rng_id = 0;
let timeoutHandle;
let ackd = false;
let serverAck = false;

//Information retrieved from STUN part of server to know what our address is
var self_address;
var self_port;
var name = "Peer";

//Information retrieved from matchmaking part of server to know what client we're talking to
var peer_address;
var peer_port;

udp_socket.on("error", err => {
  console.log(`client error:\n${err.stack}`);
  udp_socket.close();
});

udp_socket.on("message", (msg, rinfo) => {
  try {
    msg = JSON.parse(msg);
  } catch (e) {
    console.log(`! Couldn\'t parse message ${e} :\n`);
    return;
  }
  switch (msg.type) {
    case "ACK":
      if (msg.peer_ip) {
        //Message from server
        serverAck = true;
        connectToPeer(msg.peer_ip, msg.peer_port);
      } else if (
        msg.source_ip != SERVER_ADDRESS ||
        msg.source_port != SERVER_PORT
      ) {
        //If we receive an ACK from the other client, then we know we've successfully kept the UDP NAT hole punch open
        peer_name = msg.peer_name;
        ackd = NotifyAck(msg.id);
        //Make keep alive function go back to sleep
      } else {
        //ACK from server
        serverAck = true;
      }

      break;
    case "CON":
      connectToPeer(msg.peer_ip, msg.peer_port);
      break;
    case "MSG":
      console.log(`\n${msg.peer_name}: ${msg.msg}`);
      msgUpdate();
      break;
    case "SYN":
      //Acknowledge the keep alive signal
      var ackSYN = {
        type: "ACK",
        source_ip: self_address,
        source_port: self_port,
        id: msg.id + 1,
        peer_name: name
      };
      udp_socket.send(
        Buffer.from(JSON.stringify(ackSYN)),
        peer_port,
        peer_address
      );
      break;
  }
});
let serverTimeout;
udp_socket.on("listening", () => {
  rl.question("What is your name:", answer => {
    name = answer;
    rl.question("Please input a matchmaking key: ", answer => {
      var msg = { type: "REQ", msg: answer };
      let attempts = 1;
      udp_socket.send(
        Buffer.from(JSON.stringify(msg)),
        SERVER_PORT,
        SERVER_ADDRESS
      );
      serverTimeout = setInterval(() => {
        if (attempts > 3) {
          console.log("Could not contact server");
          process.exit();
        } else if (!serverAck) {
          console.log(`Attempting to contact server (Attempt ${attempts})`);
          var syn_msg = { type: "SYN", id: rng_id };
          udp_socket.send(
            Buffer.from(JSON.stringify(msg)),
            SERVER_PORT,
            SERVER_ADDRESS
          );
        } else {
          console.log("Waiting for matchmaking");
          serverAck = false;
          clearInterval(serverTimeout);
        }
        attempts++;
      }, 3000);
    });
  });
});

udp_socket.bind();

var connectToPeer = function(address, port) {
  console.log(`Connecting to peer ${address}:${port}`);
  KeepAlive();

  peer_address = address;
  peer_port = port;

  var attempts = 0;
  ackd = false;
  rng_id = Math.floor(Math.random() * 1000);

  let initConnect = setInterval(() => {
    if (++attempts > 3) {
      console.log("Could not connect to peer");
      process.exit();
    } else if (!ackd) {
      var syn_msg = { type: "SYN", id: rng_id };
      udp_socket.send(
        Buffer.from(JSON.stringify(syn_msg)),
        peer_port,
        peer_address
      );
    } else {
      clearInterval(initConnect);
      console.log(`Connected to ${peer_name}`);
      //Once we've established a reliable UDP connection, we can start messaging
      msgUpdate();
    }
  }, 3000);
};

var msgUpdate = function() {
  rl.question(">", answer => {
    // TODO: Log the answer in a database
    var msg = { type: "MSG", msg: answer, peer_name: name };
    udp_socket.send(Buffer.from(JSON.stringify(msg)), peer_port, peer_address);
    msgUpdate();
  });
};

function KeepAlive() {
  if (timeoutHandle) {
    clearInterval(timeoutHandle);
  }
  rng_id = Math.floor(Math.random() * 1000);
  var syn_msg = { type: "SYN", id: rng_id };
  let attempts = 1;
  timeoutHandle = setInterval(() => {
    if (attempts > 3) {
      console.log("Other client disconnected");
      process.exit();
    }
    udp_socket.send(
      Buffer.from(JSON.stringify(syn_msg)),
      peer_port,
      peer_address
    );
    attempts++;
  }, 1000);
}

function NotifyAck(id) {
  if (id != rng_id + 1) {
    return false;
  }

  //This stops a thing from repeating
  if (timeoutHandle) {
    clearInterval(timeoutHandle);
  }

  timeoutHandle = setInterval(() => {
    KeepAlive();
  }, 15000);
  return true;
}
