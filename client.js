//UDP 
const dgram = require('dgram');
//TCP
const net = require('net');
const readline = require('readline');

const SERVER_ADDRESS = "13.82.236.21";
const SERVER_PORT = 80;


var udp_socket = dgram.createSocket('udp4');

const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var peer_address;
var peer_port;
var ACK = false;

udp_socket.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udp_socket.close();
  });
  
udp_socket.on('message', (msg, rinfo) => {
    try {
        msg = JSON.parse(msg);
      } catch (e) {
        console.log(`! Couldn\'t parse message ${e} :\n`);
        return;
    }
    switch(msg.type)
    {
        case 'ACK':
            //Do something to update that we've acknowledged this message
            //TODO update to support three way handshaking
            if(msg.peer_ip)
            {
            connectToPeer(msg.peer_ip,msg.peer_port); 
            }
        break;
        case 'CON':
            connectToPeer(msg.peer_ip,msg.peer_port);
        break;
        case 'MSG':
            console.log(`\nReceived: ${msg.msg}`);
            msgUpdate();        
        break;
    }
  });
  
udp_socket.on('listening', () => {
    const address = udp_socket.address();
    var msg = {type:"REQ"};
    udp_socket.send(Buffer.from(JSON.stringify(msg)),SERVER_PORT,SERVER_ADDRESS);
    //console.log(`server listening ${address.address}:${address.port}`);
  });

udp_socket.bind();

var connectToPeer = function(address, port)
{
    console.log(`Connected to peer ${address}:${port}\n`);
    peer_address = address;
    peer_port = port;
    msgUpdate();
}

var msgUpdate =function()
{
    rl.question(">", (answer) => {
        // TODO: Log the answer in a database
        var msg = {type:'MSG',msg:answer};
        udp_socket.send(Buffer.from(JSON.stringify(msg)),peer_port,peer_address);
        msgUpdate();
    });
}



