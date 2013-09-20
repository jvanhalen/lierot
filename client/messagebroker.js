var MessageBroker = function() {

    var self = this;

    self.init = function() {
        console.log("MessageBroker started");
        self.ws = new WebSocket('ws://localhost:8080');

        self.ws.onmessage = function (event) {
            //var msg = JSON.parse(event.data);
            console.log("msg:", event.data);
            document.getElementById('viestialue').innerHTML += '<div id="viesti">' + event.data + '</div>';

            // Chatboxin "autoscroll"
            document.getElementById('viestialue').scrollTop += 20;

        };

        self.ws.onopen = function (event) {
            console.log("socket connected");
        }
    }

    self.init();
}