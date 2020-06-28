const express = require("express");
const dgram = require('dgram');
const { v4 : uuidv4 } = require('uuid');

/**
 * MomentJS plus simple pour gérer les dates
 */
let moment = require("moment");

const port = 3000;
const app = express();

app.get('/',function(req,res) {
    res.send(generateResponse());
})


/**
 * Liste de tous les instruments de musique
 * mappé avec le son correspondant (voir consigne)
 */
const listInstruments = new Map();
listInstruments.set("piano","ti-ta-ti");
listInstruments.set("trumpet","pouet");
listInstruments.set("flute","trulu");
listInstruments.set("violin","gzi-gzi");
listInstruments.set("drum","boum-boum");

/**
 * Le troisième instrument doit être l'instrument.
 * S'il n'est pas précisé, on lève une erreur.
 */
if(process.argv.length != 3)  {
    console.error("Un instrument doit être passé en 3ème paramètre!");
    process.exit(-1);
} else if(!listInstruments.has(process.argv[2])) {
    console.error("L'instrument n'a pas été trouvé dans la liste.. Veuillez entrer un instrument valide et reconnu");
    process.exit(-1);
}

/** @var string instrument **/
instrument = process.argv[2];

/**
 * Création de l'objet musicien contenant toutes les infos
 * souhaitées
 */
myMusician = {
    "instrument": instrument, 
    "sound": listInstruments.get(instrument), 
    "activeSince": moment().format(), // Format ISO 8601,
    "uuid": uuidv4()
}

// Ouverture du socket
const socket = dgram.createSocket('udp4');

/**
 * Définition de l'objet message chaque seconde.
 */
setInterval(function() {
    // Définition du message
    let musicianToSend = myMusician;
    musicianToSend.sendTime = moment().format();
    const message = Buffer.from(JSON.stringify(musicianToSend));
    const UDP_PORT = 2222;
    const UDP_MULTICAST_ADDRESS = "230.1.1.1";

    // Envoie du datagramme UDP 
    socket.send(message,UDP_PORT,UDP_MULTICAST_ADDRESS,function(err,bytes) {
        console.log("Envoie du payload: " + message + " à l'adresse: " + UDP_MULTICAST_ADDRESS);
    });

},1000);