
var MessageBroker = function(serverapp) {

    // Määrittele scope
    var self = this;

    self.connectedClients = [];
    self.serverapp = serverapp;
    self.counter = 0;

    self.init = function() {
        console.log("self.init");

        var WebSocketServer = require('ws').Server;

        self.wss = new WebSocketServer({server: self.serverapp});
        self.wss.on('connection', function(ws) {
            var id = setInterval(function() {
            var msg = 'ping pong ' + self.counter++;
            ws.send(msg, function() { console.log("sending ping pong", self.counter);  });
            }, 1000);

            console.log('started client interval');

            ws.on('close', function() {
                console.log('stopping client interval');
                clearInterval(id);
            });

            // Viestin vastaanotto
            ws.on('message', function(data, flags) {
                self.receive(ws, data);
            });
        });

    },

    self.send = function(to, data) {

    },

    self.receive = function(from, data) {

    },

    self.broadcast = function(data) {

    }
}

module.exports = MessageBroker;