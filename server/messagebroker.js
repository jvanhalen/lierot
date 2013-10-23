
var MessageBroker = function(serverapp) {

    // Määrittele scope
    var self = this;

    self.connectedClients  = [];
    self.serverapp = serverapp;

    self.init = function() {
        console.log("MessageBroker: initializing websocket");
        var WebSocketServer = require('ws').Server;

        self.wss = new WebSocketServer({server: self.serverapp});

        self.wss.on('connection', function(websocket) {
            console.log("MessageBroker: client connected", websocket._socket.remoteAddress, ":", websocket._socket.remotePort);

            // Talleta
            self.connectedClients[websocket._socket.remotePort] = {websocket: websocket, username: undefined};  // Mark username: undefined while client is not authorized

            // YHTEYDEN KATKETESSA
            websocket.on('close', function() {
                console.log('MessageBroker: client disconnected', websocket._socket._peername.address, ":", websocket._socket._peername.port, "(" + self.connectedClients[websocket._socket._peername.port].username + ")");
                delete self.connectedClients[websocket._socket._peername.port];
            });

            // VIESTI VASTAANOTETTAESSA
            websocket.on('message', function(data, flags) {

                // Tarkista datan tyyppi ennen parsimista - muuten palvelin kaatuu
                data = JSON.parse(data);

                // Käsittele kirjautuneilta käyttäjiltä kaikki viestit ja kirjautumattomilta käyttäjiltä vain AUTH_REQ ja REG_REQ
                if(self.connectedClients[websocket._socket._peername.port].username != undefined || data.name == "AUTH_REQ" || data.name == "REG_REQ") {
                    self.receive(websocket, data);
                }
                else {
                    console.log("skipped", data);
                }
            });
        });
    },

    self.receive = function(from, data) {
        console.log("MessageBroker.receive", data);

        // Käytä JSON.parse-funktiota vastaanotetun datan parsimiseen
        if(self.messageHandler) {
            self.messageHandler.receive(from, data);
        }
        else {
            console.log("MessageBroker: MessageHandler is not attached");
        }
    },

    self.send = function(to, msg) {
        //console.log("MessageBroker.send", msg);
        // JSON vai BSON ?
        to.send(JSON.stringify(msg));
    },

    self.broadcast = function(data) {
        console.log("broadcast data:", data);
        for(var key in self.connectedClients) {
            // Broadcast to authorized clients only
            if(self.connectedClients[key].username) {
                self.connectedClients[key].websocket.send(JSON.stringify(data));
            }
        }
    },

    self.attachClient = function(websocket, username) {
        // Talleta websocket ja sitä vastaava käyttäjänimi
        self.connectedClients[websocket._socket._peername.port].websocket = websocket;
        self.connectedClients[websocket._socket._peername.port].username = username;
    }

    self.attachHandler = function(handler) {
        self.messageHandler = handler;
        console.log("MessageBroker: MessageHandler attached");
    }

    self.init();
}

module.exports = MessageBroker;