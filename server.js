//UDP
const dgram = require("dgram");
//TCP
const net = require("net");

var SERVER_ADDRESS = "10.0.0.4";
var SERVER_PORT = 8080;

var udp_socket = dgram.createSocket("udp4");

var saved_ip = "";
var saved_port = 0;

var connections = {};

udp_socket.on("error", err => {
  console.log(`server error:\n${err.stack}`);
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
    case "REQ":
      console.log(`Receive request from ${rinfo.address}:${rinfo.port}`);
      //Request for another peer, we acknowledge it and only respond if we can match two peers
      if (
        msg.msg in connections &&
        !(
          connections[msg.msg].address == rinfo.address &&
          connections[msg.msg] == rinfo.port
        )
      ) {
        console.log(
          `Attempting to establish connection between ${connections[msg.msg]
            .address}:${connections[msg.msg]
            .port} and ${rinfo.address}:${rinfo.port} \n`
        );

        //Acknowledge newly connected peer, passing connection info through with ACK
        var ack_msg1 = {
          type: "ACK",
          self_ip: rinfo.address,
          self_port: rinfo.port,
          peer_ip: connections[msg.msg].address,
          peer_port: connections[msg.msg].port
        };
        //Inform second peer that we have a connection ready for it
        var con_msg = {
          type: "CON",
          self_ip: connections[msg.msg].address,
          self_port: connections[msg.msg].port,
          peer_ip: rinfo.address,
          peer_port: rinfo.port
        };

        //Messaged each peer
        udp_socket.send(
          Buffer.from(JSON.stringify(ack_msg1)),
          rinfo.port,
          rinfo.address
        );
        udp_socket.send(
          Buffer.from(JSON.stringify(con_msg)),
          connections[msg.msg].port,
          connections[msg.msg].address
        );

        //Delete entry
        delete connections[msg.msg];
      } else {
        //Save connection parameter
        connections[msg.msg] = { address: rinfo.address, port: rinfo.port };

        //Acknowledge peer, but we have no one to connect them with
        var ack_msg = {
          type: "ACK",
          source_ip: SERVER_ADDRESS,
          source_port: SERVER_PORT,
          self_ip: rinfo.address,
          self_port: rinfo.port
        };
        var msgBuffer = Buffer.from(JSON.stringify(ack_msg));
        udp_socket.send(msgBuffer, rinfo.port, rinfo.address);

        console.log(
          `Create mapping ${msg.msg} -> ${rinfo.address}:${rinfo.port}`
        );
      }

      break;
    case "ACK":
      break;
  }
});

udp_socket.on("listening", () => {
  const address = udp_socket.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

udp_socket.bind(SERVER_PORT, SERVER_ADDRESS);
