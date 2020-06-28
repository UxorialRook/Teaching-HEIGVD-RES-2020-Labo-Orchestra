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

/**
 * A chaque réception d'un message provenant d'un musicien
 * update ou créé un nouveau noeud dans l'orchestre
 */
socketUDP.on('message', function (message, remote) {   
    const req = JSON.parse(message.toString());
    orchestra.set(req.uuid, {
        instrument: req.instrument,
        last: moment().format(),
        activeSince: req.activeSince,
        sendTime: req.sendTime
    });

    // On check si un musicien n'a pas été actif depuis plus de 5 secondes..
    deleteInactiveMusician();
});

/**
 * Binding pour la réception des datagrams UDP
 */
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
            activeSince: musician.activeSince,
            sendTime: musician.sendTime
        });
    });

    socket.write(JSON.stringify(message));
    socket.end();
});

/**
 * Polling chaque 1 seconde pour la suppression des musiciens inactfs
 * depuis plus de 5 secondes.
 */
setInterval(function() {
    deleteInactiveMusician();
},1000)
server.listen(PORT_TCP);

function deleteInactiveMusician() {
    for(let [uuid,musician ] of orchestra) {
        let diff = moment().diff(musician.sendTime,"second");
        if(diff > 5) {
            orchestra.delete(uuid);
            console.log("Suppression du musicien: " + uuid + " pour inactivité");
        }
    }
}