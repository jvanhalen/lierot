var messages = require('../common/messages');
var game = require('./game');

var MessageHandler = function() {

    var self = this;
    self.databaseProxy = undefined;
    self.messageBroker = undefined;
    self.gameServer = undefined;

    self.receive = function(from, data) {
        //console.log(data);

        if (data.name) {
            switch (data.name) {
                case 'AUTH_REQ':
                    if (true == self.isAuthenticated(from, data)) {
                        // Already authorized, respond NOK
                        var msg = messages.message.AUTH_RESP.new();
                        msg.response = "NOK";
                        self.send(from, msg);
                    }
                    else {
                        //console.log("client requested authentication:", data.username, data.passwordhash);
                        self.databaseProxy.getLogin(from, data);
                    }
                    break;

                case 'REG_REQ':
                    //console.log("client requested registration:", data.username, data.passwordhash);
                    self.databaseProxy.newUserAccount(from, data);
                    break;

                case 'CHAT_SYNC':
                    var msg = messages.message.CHAT_SYNC.new();
                    msg.username = data.username;
                    msg.text = data.text;
                    self.broadcast(data);
                    break;

                case 'PONG':
                    console.log("received pong");
                    break;

                case 'QUEUE_MATCH':
                    console.log("QUEUE_MATCH from user:", data.username);
                    self.gameServer.queueMatch(from, data);
                    break;

                case 'USER_INPUT':
                    self.gameServer.userData(from, data);
                    break;
                
                case 'DISCONNECT_REQ':
                    // Notify GameServer
                    self.gameServer.userData(from, data);
                    // Send update to clients
                    self.removeFromPlayerList(data.username);
                    console.log("DISCONNECT_REQ");
                    break;
                
                default:
                    console.log("Default branch reached: ", data);
                    break;
            }
        }
    },

    self.broadcast = function(data) {
        if (self.messageBroker) {
            self.messageBroker.broadcast(data);
        }
    },

    self.send = function(to, data) {
        if (self.messageBroker) {
            self.messageBroker.send(to, data);
        }
    },

    self.attachBroker = function(msgBroker) {
        self.messageBroker = msgBroker;
        console.log("MessageHandler: MessageBroker attached");
    },
    
    self.attachGameServer = function(gameServer) {
        self.gameServer = gameServer;  
    },

    self.attachDatabaseProxy = function(dbproxy) {
        self.databaseProxy = dbproxy;
    },

    self.handleDatabaseResponse = function(from, msgname, result) {
        //console.log("MessageHandler: handleDatabaseResponse", msgname, result);

        switch(msgname) {
            case 'REG_REQ':
                // TODO: Tarkista paluukoodi OK/NOK ?
                var resp = messages.message.REG_RESP.new();
                resp.response = "OK";
                self.send(from, resp);
                break;

            case 'AUTH_REQ':
                // TODO: Tarkista paluukoodi OK/NOK ?
                var resp = messages.message.AUTH_RESP.new();
                resp.response = "OK";
                self.send(from, resp);
                break;

            default:
                console.log("default branch reached at MessageHandler.handleDatabaseResponse");
                break;
        }
    },
    
    self.attachClient = function(websocket, username) {
        //console.log("MessageHandler.attachClient:", username)
        self.messageBroker.attachClient(websocket, username);
        
        // Send full playerlist to the authenticated user
        self.sendFullPlayerList(websocket, username);
        
        // Send updates to other authenticated users
        self.addToPlayerList(username);
    },
    
    self.isAuthenticated = function(from, msg) {
        // Chech whether the user has already connected
        for (var item in self.messageBroker.connectedClients) {
            if (self.messageBroker.connectedClients[item].username == msg.username) {
                console.log("Client has already logged in");
                return true;
            }
        }
        if (self.messageBroker.connectedClients[from._socket._peername.port].username) {
            console.log("This socket has already registered as:", msg.username);
            return true;
        }
        
        return false;
    },
    
    self.sendFullPlayerList = function(websocket, username) {
        console.log("sending full player list to", username);
        // Send full player list to new players and
        // update to already connected clients (containing only the previously connected user)
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "full";
        
        for(var item in self.messageBroker.connectedClients) {
            if(undefined !== self.messageBroker.connectedClients[item].username) {
                console.log("username is set:", self.messageBroker.connectedClients[item].username);
                var ingame = false;
                if (undefined === self.gameServer.gameSessions[self.messageBroker.connectedClients[item].username]) {
                    ingame = false;
                }
                else {
                    ingame = true;
                }
                
                var player = {username: self.messageBroker.connectedClients[item].username,
                              authenticated: true,
                              ingame: ingame,
                              rank: 0}
                              
                msg.players.push(player);
            }
        }
        self.messageBroker.broadcast(msg);
    },
    
    self.removeFromPlayerList = function(username) {
        console.log("sending player list update 'remove'");
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "update";
    
        var ingame = false;
        if (undefined === self.gameServer.gameSessions[username]) {
            ingame = false;
        }
        else {
            ingame =  true;
        }
    
        var player = {username: username,
                      authenticated: false,
                      ingame: ingame,
                      rank: 0}
                      
        msg.players.push(player);
        self.messageBroker.broadcast(msg);
    },

    self.addToPlayerList = function(username) {
        console.log("sending player list update 'add'");
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "update";
        
        var ingame = false;
        if (undefined === self.gameServer.gameSessions[username]) {
            ingame = false;
        }
        else {
            ingame = true;
        }
        
        var player = {username: username,
                      authenticated: true,
                      ingame: ingame,
                      rank: 0}
                      
        msg.players[0] = player;
        self.broadcast(msg);
    }    
}

module.exports = MessageHandler;