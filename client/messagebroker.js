var MessageBroker = function() {

    var self = this;
    self.messageHandler = undefined;

    self.init = function() {
        console.log("MessageBroker started");
        self.ws = new WebSocket('ws://lierot-jvanhalen.rhcloud.com:8000');

        self.ws.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            self.messageHandler.receive(msg);
        };

        self.ws.onerror = function (event) {
            console.log("websocket failed");
        };

        self.ws.onopen = function (event) {
            console.log("websocket connected");
        };
    },

    self.send = function(data) {
        console.log("data:", data);
        self.ws.send(JSON.stringify(data)); // Käytä JSON.stringify serialisoimaan lähetettävä data
    }

    self.attachHandler = function(messageHandler) {
        self.messageHandler = messageHandler;
    },

    // Alusta websocket luonnin yhteydessä
    self.init();
}