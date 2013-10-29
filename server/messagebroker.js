var messages = require('../common/messages');

var MessageBroker = function(serverapp) {

    // Määrittele scope
    var self = this;

    self.clients  = {}; // Index with username
    self.serverapp = serverapp;
    self.connected = 0;
    self.authenticated = 0;
    self.skipped = 0;
    self.receivedMessages = 0;

    self.init = function() {
        console.log("MessageBroker: initializing websocket");
        var WebSocketServer = require('ws').Server;

        self.wss = new WebSocketServer({server: self.serverapp});

        self.wss.on('connection', function(websocket) {
            //

            console.log("MessageBroker: client connected to port", websocket._socket.remotePort);
            websocket.username = null;
            self.connected++;

            // YHTEYDEN KATKETESSA
            websocket.on('close', function() {
                console.log("MessageBroker: client disconnected (" + websocket.username +")");
                var username = websocket.username;

                // Set websocket's username to null
                websocket.username = null;

                // Notify other server objects about the disconnection
                if (username != null) {
                    self.disconnectClient(username);
                    console.log(username, "disconnected");
                    var msg = messages.message.DISCONNECT_REQ.new();
                    msg.username = username;
                    self.receive(username, msg);

                }
                else {
                    self.connected--;
                }
            });

            // VIESTI VASTAANOTETTAESSA
            websocket.on('message', function(data, flags) {
                self.receivedMessages++;    // Possible overflow?

                // TODO: Tarkista datan tyyppi ennen parsimista - muuten palvelin kaatuu
                data = JSON.parse(data);

                // Separate authentication and registration messages from others
                if(data.name == "AUTH_REQ" || data.name == "REG_REQ") {
                    console.log("authentication request from", websocket.username);
                    if (null == websocket.username && undefined === self.clients[data.username]) {
                        self.messageHandler.authenticate(websocket, data);
                    }
                    else {
                        console.log("MessageBroker: websocket already authenticated as", websocket.username);
                        var resp = messages.message.AUTH_RESP.new();
                        resp.response = "NOK";
                        websocket.send(JSON.stringify(resp));
                    }
                }
                else if (websocket.username != null) {
                    // Handle disconnect here, then delegate
                    if (data.name == "DISCONNECT_REQ") {
                        self.disconnectClient(websocket.username);
                    }
                    // User has authenticated, proceed to message handling
                    self.receive(websocket.username, data);
                }
                else {
                    // Skip message
                    //console.log("skipped", data);
                    self.skipped++;
                    if (self.skipped % 1) { // Change 1 to 1000 in production
                        console.log("MessageBroker has skipped", self.skipped, "messages");
                    }
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
        //console.log("MessageBroker: send to", to + ":", msg);
        if (undefined !== to && null != to) {
            var open = require('ws').OPEN;
            if (undefined !== self.clients[to]) {
                if (self.clients[to].readyState == open) {
                    self.clients[to].send(JSON.stringify(msg));
                }
            }
        }
    },

    self.broadcast = function(data) {
        //console.log("broadcast data:", data.name);
        for(var key in self.clients) {
            var open = require('ws').OPEN;
            if (self.clients[key].readyState == open) {
                self.clients[key].send(JSON.stringify(data));
            }
        }
    },

    self.connectClient = function(websocket, username) {
        console.log("MessageBroker: connected client", username);
        // Add username to websocket
        websocket.username = username;
        self.clients[username] = websocket;
        self.authenticated++;
    },

    self.disconnectClient = function(username) {
        console.log("MessageBroker: disconnect client:", username);
        // Add username to websocket
        delete self.clients[username];
        self.authenticated--;
        self.connected--;
    },

    self.attachHandler = function(handler) {
        self.messageHandler = handler;
        console.log("MessageBroker: MessageHandler attached");
    }

    self.init();
}

module.exports = MessageBroker;