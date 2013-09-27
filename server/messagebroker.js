
var MessageBroker = function(serverapp) {

   // Määrittele scope
   var self = this;

   self.connectedClients = [];
   self.serverapp = serverapp;

   self.init = function() {
      console.log("MessageBroker: initializing websocket")
      var WebSocketServer = require('ws').Server;

      self.wss = new WebSocketServer({server: self.serverapp});

      self.wss.on('connection', function(websocket) {
         console.log("MessageBroker: client connected", websocket._socket.remoteAddress, ":", websocket._socket.remotePort);

         // Talleta
         self.connectedClients[websocket._socket.remotePort] = websocket;

         // YHTEYDEN KATKETESSA
         websocket.on('close', function() {
            console.log('MessageBroker: client disconnected', websocket._socket.remoteAddress, ":", websocket._socket.remotePort);
            delete self.connectedClients[websocket._socket.remotePort];
         });

         // VIESTI VASTAANOTETTAESSA
         websocket.on('message', function(data, flags) {
            self.receive(websocket, JSON.parse(data));
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
         self.connectedClients[key].send(JSON.stringify(data));
      }
   },

   self.attachHandler = function(handler) {
      self.messageHandler = handler;
      console.log("MessageBroker: MessageHandler attached");
   }

   self.init();
}

module.exports = MessageBroker;