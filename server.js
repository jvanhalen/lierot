var MessageBroker = require('./server/messagebroker');
var MessageHandler = require('./server/messagehandler');
var DatabaseProxy = require('./server/databaseproxy');
var GameServer = require('./server/game');
var messages = require('./common/messages');
var os = require('os'); // For system load avg


var Server = function() {

    //  Määrittele scope
    var self = this;

    self.setupVariables = function() {
        //  Set the environment variables we need for OpenShift app
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    self.init = function() {

        console.log("Server: initializing...");

        var http = require('http'),
            express = require('express');
        self.app = express();

        // Salli hakemistot
        self.app.use('/client', express.static(__dirname + '/client'));
        self.app.use('/common', express.static(__dirname + '/common'));

        // Palauta index.html selaimille
        self.app.get('/', function(req, res) {
            console.log("loading index.html");
            res.sendfile('index.html');
        });

        self.server = http.createServer(self.app);
        self.server.listen(self.port, self.ipaddress);
        console.log("server running @ ", self.ipaddress, ":", self.port);

        // Luo palvelinoliot
        self.messageBroker = new MessageBroker(self.server);
        self.messageHandler = new MessageHandler();
        self.databaseProxy = new DatabaseProxy();
        self.gameServer = new GameServer(self.messageHandler);

        // Kytke oliot toisiinsa (molempiin suuntiin):
        // MessageBroker -> MessageHandler -> DatabaseProxy
        self.messageBroker.attachHandler(self.messageHandler);
        self.messageHandler.attachDatabaseProxy(self.databaseProxy);

        // DatabaseProxy -> MessageHandler -> MessageBroker
        self.databaseProxy.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);

        console.log("server started");
    },

    self.statistics = function() {
        var msg = messages.message.SERVER_STATS.new();
        msg.systemload = os.loadavg();
        msg.uptime = process.uptime();
        msg.memusage = process.memoryUsage();
        msg.system = os.hostname() + ": " + os.type() + ', ' + os.platform() + ', ' + os.arch();
        msg.connectedusers = self.messageBroker.connected;
        msg.authenticatedusers = self.messageBroker.authenticated,
        msg.totalusers = 0; // TODO: query database
        msg.userlist = [{username: "username",
                         ingame: false}],

        console.log("mem: " + (msg.memusage.rss/1000000).toFixed(2) + "/" +
                              (msg.memusage.heapTotal/1000000).toFixed(2) + "/" +
                              (msg.memusage.heapUsed/1000000).toFixed(2) +
                    " cpu: " + msg.systemload[0].toPrecision(2) + "/" +
                              msg.systemload[1].toPrecision(2) + "/" +
                              msg.systemload[2].toPrecision(2) +
                    " users: " + msg.connectedusers + "/" + msg.authenticatedusers + "/" + msg.totalusers + " (c/a/t)");
        self.messageHandler.broadcast(msg);
    }
    // Poll some statistics
    self.timer = setInterval(self.statistics, 10000);

    // Aseta palvelimen sisäiset muuttujat
    self.setupVariables();

    // Alusta ja käynnistä palvelin luotaessa
    self.init();
}

// Luo palvelininstanssi
var server = new Server("server");
