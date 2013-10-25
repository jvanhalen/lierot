
var mato = function() {  // Tällä määrittelyllä varaudutaan siihen että lieroja on tulevaisuudessa useampiakin
    this.nimi = "liero";
    this.vari = "blue";
    this.aloitusPituus = 5;
    this.sijainti = [];
    this.suunta = "oikea"; // Menosuunta: oikea, vasen, ylos, alas
    this.nopeus = 1;
    this.pisteet = 0;

    // Alusta mato
    for(var x=0; x<this.aloitusPituus; x++) {
        this.sijainti[x] = x;
    }
}

var ruoka = function() {
    this.vari = "red";
    this.kasvu = Math.floor(Math.random()*1+1); // Paljonko mato kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var pelialue = function() {
    this.korkeus = 40;
    this.leveys = 40;
    this.vari = "lightblue";   // Ruudukon väri
}

var Peli = function () {
    var self = this;
    self.messageBroker = undefined;
    self.messageHandler = undefined;
    self.kaynnissa = false;

    self.alusta = function() {

        self.messageBroker = new MessageBroker();
        self.messageHandler = new MessageHandler(self);

        self.messageBroker.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);

    },

    self.alustaPeli = function(uusipeli) {
        console.log("alustaPeli");

        if (null == uusipeli) {
            console.log("luo tyhjä pelilauta");
            self.pelialue = new pelialue();
        }
        else {
            self.mato = new mato();
            self.pelialue = new pelialue();
            self.ruoanMaara = 8;
            self.ruoat = [];
            self.ruoka = new ruoka();
        }

        self.alustaPelilauta();

    },

    self.alustaPelilauta = function() {
        console.log("alustaPelilauta");

        document.getElementById('pelilauta').innerHTML = "";
        var pelilauta = '<p id="pistetilanne"></p>';
        // Luo ruudukko
        pelilauta += '<table width="400" height="400">';
        for(var i=0; i<self.pelialue.korkeus; i++) {
            pelilauta += '<tr>'; // Luo uusi rivi
            for(var j=0; j<self.pelialue.leveys; j++) {
                var id = (j+(i*self.pelialue.korkeus));
                var ruutu = '<td id="' + id + '"></td>';
                pelilauta += ruutu;
            }
            pelilauta += '</tr>';
        }
        pelilauta += '</table>';
        pelilauta += '<input id="syote" name="syotekentta" size="1" maxLength="1" />';
        pelilauta += "W = ylos, A = vasemmalle, S = alas, D = oikealle";
        pelilauta += '<input id="aloitapeli_painike" type="submit" value="AloitaPeli" onclick="peli.aloitaPeli()">';

        document.getElementById('pelilauta').innerHTML = pelilauta;

        self.varitaPelilauta();
    },

    self.varitaPelilauta = function() {
        //console.log("varitaPelilauta");
        for(var i=0; i<self.pelialue.korkeus; i++) {
            for(var j=0; j<self.pelialue.leveys; j++) {
                var id = (j+(i*self.pelialue.korkeus));
                document.getElementById(id).bgColor = self.pelialue.vari;
            }
        }
/*
        // Aseta liero aloituskohtaan
        if (self.mato) {
            console.log("aseta mato");
            for(var x=0; x<self.mato.aloitusPituus; x++) {
                document.getElementById(self.mato.sijainti[x]).bgColor = self.mato.vari;
            }
        }
*/
    },

    self.asetaRuoat = function() {
        // Tarkista puuttuuko ruokia
        // Aseta ruoat satunnaiseen kohtaan
        while(this.ruoat.length < this.ruoanMaara) {
            // Huomaa että pidempi mato voi hidastaa sopivan ruoan sijoituspaikan arpomista (pitää ehkä arpoa useampi satunnaisluku)
            // Ei haittaa meitä tässä tapauksessa
            var x = Math.floor(Math.random()*this.pelialue.korkeus*this.pelialue.leveys);
            if (document.getElementById(x).bgColor == this.pelialue.vari) {
                this.ruoat.push(x);
                document.getElementById(x).bgColor = this.ruoka.vari;
            }
        }
    },

    self.poistaRuoka = function(ruutu) {
        //console.log("Poista ruoka", ruutu);
        for (var x=0; x<self.ruoat.length; x++) {
            if (self.ruoat[x] == ruutu) {
                self.ruoat.splice(x, 1);
            }
        }
        // Arvo uusi ruoka
        self.asetaRuoat();

    },

    self.paivitaTilanne = function(msg) {
        //console.log("paivita tilanne");

        // Puhdista pelilauta
        self.varitaPelilauta();
        
        // Renderöi madot
        for (var id=0; id<msg.worms.length; id++) {
            for (var x=0; x<msg.worms[id].sijainti.length; x++) {
                document.getElementById(msg.worms[id].sijainti[x]).bgColor = msg.worms[id].vari;
            }
        }

        // Renderöi ruoat
        for (var x=0; x<msg.food.length; x++) {
            document.getElementById(msg.food[x].sijainti).bgColor = msg.food[x].vari;
        }
        
        // Päivitä pistetilanne
        document.getElementById("pistetilanne").innerHTML = "";
        for (var x=0; x<msg.worms.length; x++) {
            document.getElementById("pistetilanne").innerHTML += msg.worms[x].nimi;
            document.getElementById("pistetilanne").innerHTML += ":&nbsp;" +  msg.worms[x].pisteet + "&nbsp;&nbsp|&nbsp;&nbsp;";
        }
        if (msg.state == "END") {
            alert("Game over!");
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
        var suunta = null;
        // Toimiikohan alla oleva ORaus kaikissa selaimissa?
        var syote = event.which | event.keyCode | event.charCode;
        switch (syote) {
            case 65:
            case 97:
                console.log("A");
                suunta = 'vasen';
                break;
            
            case 68:
            case 100:
                console.log("D");
                suunta = 'oikea';
                break;
            
            case 83:
            case 115:
                console.log("S");
                suunta = 'alas';
                break;
            
            case 87:
            case 119:
                console.log("W");
                suunta = 'ylos';
                break;
            
            default:
                console.log(syote);
                break;
        }
        
        if (suunta != null) {
            // Lähetä päivitys palvelimelle
            var msg = messages.message.USER_INPUT.new();
            msg.direction = suunta;
            msg.username = self.messageHandler.getUsername();
            self.messageHandler.send(msg);
        }
        return false;
    },
    
    self.lopetaPeli = function() {
        self.kaynnissa = false;
    },
    
    self.onKaynnissa = function() {
        return self.kaynnissa;
    }

    self.alusta();
}
