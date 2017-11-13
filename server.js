//UDP 
const dgram = require('dgram');
//TCP
const net = require('net');

var SERVER_ADDRESS = "localhost";
var SERVER_PORT = 80;

var udp_socket = dgram.createSocket('udp4');

var saved_ip = "";
var saved_port = 0;

const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');
client.send(message, 41234, 'localhost', (err) => {
  client.close();
});

udp_socket.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udp_socket.close();
  });
  
udp_socket.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);    
    try {
        msg = JSON.parse(msg);
      } catch (e) {
        console.log(`! Couldn\'t parse message ${e} :\n`);
        return;
    }
    switch(msg.type)
    {
        case "REQ":
            console.log(`Receive request from ${rinfo.address}:${rinfo.port} \n`);
            //Request for another peer, we acknowledge it and only respond if we can match two peers

            if(saved_ip == "")
            {
                //TODO Potentially a triple handshake ACK, where we only save the info when we receive the ACK back in the server
                // In that case we wouldn't embed anything in an ACK message, we'd send a separate CON message to each
                // This wouldn't be exactly how TCP does its 3-way handshake but whatever
                
                //Acknowledge peer, but we have no one to connect them with
                var ack_msg = {type:'ACK', self_ip:rinfo.address, self_port: rinfo.port};
                var msgBuffer = Buffer.from(JSON.stringify(ack_msg));
                udp_socket.send(msgBuffer,rinfo.port,rinfo.address);

                //Save information to pass onto next peer that connects
                saved_port = rinfo.port;
                saved_ip =rinfo.address;
            }
            //If the same peer connects again, let's not connect them to themselves
            //The 
            else if(saved_ip != rinfo.address || saved_port != rinfo.port)
            {
                console.log(`Attempting to establish connection between ${saved_ip}:${saved_port} and ${rinfo.address}:${rinfo.port} \n`);
                //TODO: since this is udp, we have no way of ensuring messages arrive, so a more robust handshake would solve it.
                //      original python solution was to timeout a client if they haven't received a connection
                //      we can use some sort of timeout system where we just cancel shit if we dont hear back

                //Acknowledge newly connected peer, passing connection info through with ACK
                var ack_msg1 = {type:'ACK', self_ip : rinfo.address, self_port : rinfo.port, peer_ip : saved_ip, peer_port : saved_port};
                //Inform second peer that we have a connection ready for it
                var con_msg = {type :'CON', self_ip : saved_ip, self_port : saved_port, peer_ip : rinfo.address, peer_port : rinfo.port};

                //Messaged each peer
                udp_socket.send( Buffer.from(JSON.stringify(ack_msg1)),rinfo.port,rinfo.address);
                udp_socket.send( Buffer.from(JSON.stringify(con_msg)), saved_port, saved_ip);

                //Reset flags
                saved_ip = "";
                saved_port = 0;
            }

            break;
    }

  });
  
udp_socket.on('listening', () => {
    const address = udp_socket.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

udp_socket.bind(SERVER_PORT, SERVER_ADDRESS);