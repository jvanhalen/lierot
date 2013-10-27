var messages = require('../common/messages');

var MessageBroker = function(serverapp) {

    // Määrittele scope
    var self = this;

    self.connectedClients  = {};
    self.serverapp = serverapp;
    self.connected = 0;
    self.authenticated = 0;

    self.init = function() {
        console.log("MessageBroker: initializing websocket");
        var WebSocketServer = require('ws').Server;

        self.wss = new WebSocketServer({server: self.serverapp});

        self.wss.on('connection', function(websocket) {
            //
            
            console.log("MessageBroker: client connected", websocket._socket.remoteAddress, ":", websocket._socket.remotePort);
            self.connected++;

            // Talleta
            self.connectedClients[websocket._socket.remotePort] = {websocket: websocket, username: undefined, ingame: false};  // Mark username: undefined while client is not authenticated

            // YHTEYDEN KATKETESSA
            websocket.on('close', function() {
                console.log('MessageBroker: client disconnected', websocket._socket._peername.address, ":", websocket._socket._peername.port, "(" + self.connectedClients[websocket._socket._peername.port].username + ")");
                
                // Notify other server objects about the disconnection
                var msg = messages.message.DISCONNECT_REQ.new();
                msg.username = self.connectedClients[websocket._socket._peername.port].username;
                
                // Check if the user has authenticated or not
                if (self.connectedClients[websocket._socket._peername.port].username !== undefined)  {
                    self.authenticated--;
                }

                self.connected--;

                delete self.connectedClients[websocket._socket._peername.port];
                // call receive() AFTER delete
                self.receive(undefined, msg);

            });

            // VIESTI VASTAANOTETTAESSA
            websocket.on('message', function(data, flags) {

                // TODO: Tarkista datan tyyppi ennen parsimista - muuten palvelin kaatuu
                data = JSON.parse(data);

                // Käsittele kirjautuneilta käyttäjiltä kaikki viestit ja kirjautumattomilta käyttäjiltä vain AUTH_REQ ja REG_REQ
                if(self.connectedClients[websocket._socket._peername.port].username !== undefined || data.name == "AUTH_REQ" || data.name == "REG_REQ") {
                    self.receive(websocket, data);
                }
                else {
                    console.log("skipped", data);
                }
            });
        });
    },

    self.receive = function(from, data) {
        //console.log("MessageBroker.receive", data);

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
        //console.log("sending to port", to._socket._peername.port);
        // JSON vai BSON ?
        if (undefined !== to && null != to) {
            if (undefined !== self.connectedClients[to._socket._peername.port]) {
                to.send(JSON.stringify(msg));
            }
        }
        else {
            console.log("client already disconnected:", to._socket._peername.port);
        }
    },

    self.broadcast = function(data) {
        //console.log("broadcast data:", data.name);
        for(var key in self.connectedClients) {
            // Broadcast to authenticated clients only
            if(self.connectedClients[key].username) {
                self.connectedClients[key].websocket.send(JSON.stringify(data));
            }
        }
    },

    self.attachClient = function(websocket, username) {
        console.log("attach client:", username);
        
        // Talleta websocket ja sitä vastaava käyttäjänimi
        self.authenticated++;
        self.connectedClients[websocket._socket._peername.port].websocket = websocket;
        self.connectedClients[websocket._socket._peername.port].username = username;
    },

    self.attachHandler = function(handler) {
        self.messageHandler = handler;
        console.log("MessageBroker: MessageHandler attached");
    }

    self.init();
}

module.exports = MessageBroker;