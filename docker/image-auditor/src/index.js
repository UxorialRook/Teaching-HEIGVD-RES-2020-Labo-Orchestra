const dgram = require('dgram');
const net = require('net');
const moment = require('moment');
const { min } = require('moment');

const PORT_UDP = 2150;
const PORT_TCP = 2205;
const HOST_UDP = '230.1.1.1';
const server = net.createServer();
const socketUDP = dgram.createSocket('udp4');

let orchestra = new Map();

socketUDP.on('message', function (message, remote) {   
    const req = JSON.parse(msg.toString());
    orchestra.set(req.uuid, {
        instrument: req.instrument,
        last: moment().format(),
        activeSince: req.activeSince
    });

    orchestra.forEach(musician => {
        if(moment(Date.now()).diff(musician.activeSince, 'seconds') > 5) {
            orchestra.delete(musician);
        }
    })
});

socketUDP.bind(PORT_UDP, HOST_UDP, socket => {
    var address = socketUDP.address();
    console.log('Client UDP écoute sur ' + address.address + ":" + address.port);
    socketUDP.addMembership(HOST_UDP);
});

server.on("connection", socket => {
    let message = [];

    orchestra.forEach(musician => {
        message.push({
            uuid: musician.uuid,
            instrument: musician.instrument,
            activeSince: musician.activeSince
        });
    });

    socket.write(JSON.stringify(message));
    socket.end();
});

server.listen(PORT_TCP);