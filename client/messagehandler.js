var MessageHandler = function(peli) {
    var self = this;
    self.peli = peli;
    self.username = undefined;
    self.messageBroker = undefined;

    self.receive = function(msg) {
        console.log(msg);

        switch (msg.name) {
            case 'CHAT_SYNC':
                console.log("chat_sync");
                // jQuerysta löytyisi suoraan .append()-funktio, jolla saataisiin sisältöä "jatkettua"
                document.getElementById('viestialue').innerHTML += '<div id="viesti"><a href="#" title="viesti">'+ msg.username + ':</a>&nbsp;&nbsp;' + msg.text + '</div>';
                // Chatbox auto-scroll
                document.getElementById('keskustelualue').scrollTop += 20;
                break;

            case 'AUTH_RESP':
                console.log(msg.name, msg.response);
                if(msg.response == "OK") {
                    self.setUsername(document.getElementById('kayttajanimi').value);
                    document.getElementById('infoteksti').style.color = "black";
                    document.getElementById('infoteksti').innerHTML = "Kirjauduit käyttäjänä <strong>" +
                    document.getElementById('kayttajanimi').value + "</strong>";
                    document.getElementById('infoteksti').innerHTML += '<br /><input id="poistu_painike" type="submit" value="Poistu" onclick="poistu();">';
                    self.peli.alustaPeli();
                }
                else {
                    var tmp = document.getElementById('infoteksti').innerHTML;
                    console.log(tmp);
                    document.getElementById('infoteksti').style.color = "red";
                    document.getElementById('infoteksti').innerHTML = "Kirjautuminen epäonnistui";
                    var t = setTimeout(function() { document.getElementById('infoteksti').innerHTML = tmp; document.getElementById('infoteksti').style.color = "black"; }, 2000)
                }
                break;

            case 'REG_RESP':
                console.log(msg.name, msg.response);
                break;

            default:
                console.log("Default branch reached: ", msg);
                break;
        }
    },

    self.init = function() {
        console.log("MessageHandler started");
    },
    self.send = function(data) {
        self.messageBroker.send(data);
    },
    self.setUsername = function(username) {
        self.username = username;
    },
    self.getUsername = function() {
        return self.username;
    },

    self.attachBroker = function(messageBroker) {
        self.messageBroker = messageBroker;
    }

    self.init();
}