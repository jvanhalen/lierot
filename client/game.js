
var worm = function() {  // Tällä määrittelyllä varaudutaan siihen että lieroja on tulevaisuudessa useampiakin
    this.name = "liero";
    this.color = "blue";
    this.startingLength = 5;
    this.location = [];
    this.direction = "right"; // Menosuunta: right, left, up, down
    this.velocity = 1;
    this.score = 0;

    // Alusta worm
    for(var x=0; x<this.startingLength; x++) {
        this.location[x] = x;
    }
}

var food = function() {
    this.color = "red";
    this.growth = Math.floor(Math.random()*1+1); // Paljonko worm kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var gameArea = function() {
    this.height = 40;
    this.width = 40;
    this.color = "lightblue";   // Ruudukon väri
}

var Peli = function () {
    var self = this;
    self.name = null;
    self.messageBroker = undefined;
    self.messageHandler = undefined;
    self.kaynnissa = false;;

    self.init = function() {

        self.messageBroker = new MessageBroker();
        self.messageHandler = new MessageHandler(self);

        self.messageBroker.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);

    },

    self.alustaPeli = function(uusipeli) {
        console.log("alustaPeli");

        if (null == uusipeli) {
            console.log("luo tyhjä pelilauta");
            self.gameArea = new gameArea();
        }
        else {
            self.worm = new worm();
            self.gameArea = new gameArea();
            self.amountOfFood = 8;
            self.foods = [];
            self.food = new food();
        }

        self.initGameboard();
        self.kaynnissa = true;
    },

    self.initGameboard = function() {
        console.log("initGameboard");

        document.getElementById('pelilauta').innerHTML = "";
        var pelilauta = '<p id="pistetilanne"></p>';
        // Luo ruudukko
        pelilauta += '<table width="400" height="400">';
        for(var i=0; i<self.gameArea.height; i++) {
            pelilauta += '<tr>'; // Luo uusi rivi
            for(var j=0; j<self.gameArea.width; j++) {
                var id = (j+(i*self.gameArea.height));
                var ruutu = '<td id="' + id + '"></td>';
                pelilauta += ruutu;
            }
            pelilauta += '</tr>';
        }
        pelilauta += '</table>';
        //pelilauta += '<input id="input" name="syotekentta" size="1" maxLength="1" />';
        pelilauta += "W = up, A = vasemmalle, S = down, D = oikealle";
        pelilauta += "&nbsp;&nbsp;&nbsp;";
        pelilauta += '<input id="aloitapeli_painike" type="submit" value="AloitaPeli" onclick="game.aloitaPeli()">';

        document.getElementById('pelilauta').innerHTML = pelilauta;

        self.varitaPelilauta();
    },

    self.varitaPelilauta = function() {
        //console.log("varitaPelilauta");
        for(var i=0; i<self.gameArea.height; i++) {
            for(var j=0; j<self.gameArea.width; j++) {
                var id = (j+(i*self.gameArea.height));
                document.getElementById(id).bgColor = self.gameArea.color;
            }
        }
/*
        // Aseta liero aloituskohtaan
        if (self.worm) {
            console.log("aseta worm");
            for(var x=0; x<self.worm.startingLength; x++) {
                document.getElementById(self.worm.location[x]).bgColor = self.worm.color;
            }
        }
*/
    },

    self.setFood = function() {
        // Tarkista puuttuuko ruokia
        // Aseta foods satunnaiseen kohtaan
        while(this.foods.length < this.amountOfFood) {
            // Huomaa että pidempi worm voi hidastaa sopivan ruoan sijoituspaikan arpomista (pitää ehkä arpoa useampi satunnaisluku)
            // Ei haittaa meitä tässä tapauksessa
            var x = Math.floor(Math.random()*this.gameArea.height*this.gameArea.width);
            if (document.getElementById(x).bgColor == this.gameArea.color) {
                this.foods.push(x);
                document.getElementById(x).bgColor = this.food.color;
            }
        }
    },

    self.removeFood = function(ruutu) {
        //console.log("Poista food", ruutu);
        for (var x=0; x<self.foods.length; x++) {
            if (self.foods[x] == ruutu) {
                self.foods.splice(x, 1);
            }
        }
        // Arvo uusi food
        self.setFood();

    },

    self.updateMatch = function(msg) {
        //console.log("paivita tilanne");

        // Puhdista pelilauta
        self.varitaPelilauta();

        // Render worms
        for (var id=0; id<msg.worms.length; id++) {
            for (var x=0; x<msg.worms[id].location.length; x++) {
                document.getElementById(msg.worms[id].location[x]).bgColor = msg.worms[id].color;
            }
        }

        // Render foods
        for (var x=0; x<msg.food.length; x++) {
            document.getElementById(msg.food[x].location).bgColor = msg.food[x].color;
        }

        // Päivitä pistetilanne
        document.getElementById("pistetilanne").innerHTML = "";
        for (var x=0; x<msg.worms.length; x++) {
            var separator = (x+1 != msg.worms.length) ? "&nbsp;&nbsp|&nbsp;&nbsp;" : "";
            document.getElementById("pistetilanne").innerHTML += '<strong><font color="' + msg.worms[x].color + '">' + msg.worms[x].name +'</font></strong>';
            document.getElementById("pistetilanne").innerHTML += ":&nbsp;" +  msg.worms[x].score + separator;

        }
        if (msg.state == "END") {
            alert("Game over!");
            self.endGame();
        }
    },

    self.aloitaPeli = function(){
        // Tarkista syötteet
        // Lähetä kirjautumispyyntö
        var msg = messages.message.QUEUE_MATCH.new();
        msg.username = self.messageHandler.getUsername();
        self.messageHandler.send(msg);
        self.kaynnissa = true;

    },

    self.kasittelePainallus = function(event) {
        var direction = null;
        // Toimiikohan alla oleva ORaus kaikissa selaimissa?
        var input = event.which | event.keyCode | event.charCode;
        switch (input) {
            case 65:
            case 97:
                //console.log("A");
                direction = 'left';
                break;

            case 68:
            case 100:
                //console.log("D");
                direction = 'right';
                break;

            case 83:
            case 115:
                //console.log("S");
                direction = 'down';
                break;

            case 87:
            case 119:
                //onsole.log("W");
                direction = 'up';
                break;

            default:
                console.log(input);
                break;
        }

        if (direction != null) {
            // Lähetä päivitys palvelimelle
            var msg = messages.message.USER_INPUT.new();
            msg.direction = direction;
            msg.username = self.messageHandler.getUsername();
            self.messageHandler.send(msg);
        }
        return false;
    },

    self.endGame = function() {
        self.kaynnissa = false;
    },

    self.isRunning = function() {
        return self.kaynnissa;
    },

    self.challenge = function(username) {
        var msg = messages.message.CHALLENGE_REQ.new();
        msg.challenger = self.name;
        msg.challengee = username;

        self.messageHandler.send(msg);
    },

    self.setUsername = function(name) {
        self.name = name;
    },

    self.getUsername = function() {
        return self.name;
    }

    self.init();
}
