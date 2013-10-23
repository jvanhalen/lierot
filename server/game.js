var messages = require('../common/messages');

var mato = function(nimi){  // Tällä määrittelyllä varaudutaan siihen että lieroja on tulevaisuudessa useampiakin
    var self = this;
    self.nimi = nimi;
    self.vari = "blue";
    self.aloitusPituus = 5;
    self.sijainti = [];
    self.suunta = "oikea"; // Menosuunta: oikea, vasen, ylos, alas
    self.nopeus = 1;
    self.pisteet = 0;

    // Alusta mato
    for(var x=0; x<self.aloitusPituus; x++) {
        self.sijainti[x] = x;
    }
}

var ruoka = function(sijainti){
    var self = this;
    self.sijainti = sijainti;
    self.vari = "red";
    self.kasvu = Math.floor(Math.random()*1+1); // Paljonko mato kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var pelialue = function() {
    var self = this;
    self.solut = [];
    self.korkeus = 40;
    self.leveys = 40;
    self.vari = "lightblue";   // Ruudukon väri
}

// Pelisession määrittely alkaa tästä
var Peli = function(from, data, messagehandler) {

    var self = this;

    self.messageHandler = messagehandler;

    self.ajastin = 0;
    self.mato = new mato(data.username);
    self.pelialue = new pelialue();
    self.ruoanMaara = 8;
    self.ruoat = [];

    self.alusta = function() {
        console.log("new game created for", data.username);


        self.mato = new mato(data.username);
        self.pelialue = new pelialue();
        self.alustaPelilauta();
        self.asetaRuoat();

        var msg = messages.message.MATCH_SYNC.new();
        msg.phase = "INIT";
        msg.msgid = 101;

        msg.worms[0] = self.mato;
        msg.food = self.ruoat;

        console.log(msg);
        self.messageHandler.send(from, msg);

        // Huomioi setInterval scope .bind(self)
        //peli.ajastin = self.setInterval(peli.paivitaTilanne.bind(self), 150);
    },

    self.alustaPelilauta = function() {

        // Luo ruudukko
        /*
        for(var i=0; i<self.pelialue.korkeus; i++) {
            for(var j=0; j<self.pelialue.leveys; j++) {
                var id = (j+(i*self.pelialue.korkeus));
                pelilauta += ruutu;
            }
        }*/
        self.varitaPelilauta();
    },

    self.varitaPelilauta = function() {
        for(var i=0; i<self.pelialue.korkeus; i++) {
            for(var j=0; j<self.pelialue.leveys; j++) {
                var id = (j+(i*self.pelialue.korkeus));
                self.pelialue.solut[id] = self.pelialue.vari;
            }
        }

        // Aseta liero aloituskohtaan
        for(var x=0;x<self.mato.aloitusPituus;x++) {
            self.pelialue.solut[x] = self.mato.vari;
        }

    },
    self.asetaRuoat = function() {
        // Tarkista puuttuuko ruokia
        // Aseta ruoat satunnaiseen kohtaan
        var i = 0;
        while(self.ruoat.length < self.ruoanMaara) {
            var x = Math.floor(Math.random()*self.pelialue.korkeus*self.pelialue.leveys);
            self.ruoat.push(new ruoka(x));
            self.pelialue.solut[x] = self.ruoat[self.ruoat.length-1].vari;
        }
    },

    self.poistaRuoka = function(ruutu) {
        //console.log("Poista ruoka", ruutu);
        for (var x=0;x<self.ruoat.length; x++) {
            if (self.ruoat[x].sijainti == ruutu) {
                self.ruoat.splice(x, 1);
            }
        }
        // Arvo uusi ruoka
        self.asetaRuoat();

    },

    self.paivitaTilanne = function() {
        console.log(self);

        // Lue ja käsittele syöte
        //document.getElementById("syote").focus();
        var syote = 0; //document.getElementById("syote").value;
        var muutos = 0;

        // TODO: parempi näppäinpainallusten kontrolli (nuolinäppäimet, WASD, etc.)
        switch (syote.toLowerCase()) {

            case "w":
                if (self.mato.suunta != "alas") {
                    self.mato.suunta = "ylos";
                }
                break;

            case "a":
                if (self.mato.suunta != "oikea") {
                    self.mato.suunta = "vasen";
                }
                break;

            case "s":
                if (self.mato.suunta != "ylos") {
                    self.mato.suunta = "alas";
                }
                break;

            case "d":
                if (self.mato.suunta != "vasen") {
                    self.mato.suunta = "oikea";
                }
                break;
            default:
                break;
        }

        //document.getElementById("syote").value = "";

        switch(self.mato.suunta) {
            case "oikea":
                muutos += self.mato.nopeus;
                break;
            case "vasen":
                muutos -= self.mato.nopeus;
                break;
            case "ylos":
                muutos -= (self.pelialue.korkeus)*(self.mato.nopeus);
                break;
            case "alas":
                muutos += (self.pelialue.korkeus)*(self.mato.nopeus);
                break;
            default:
                break;
        }

        // Liikuta matoa

        // Talleta hännän sijainti
        var hanta = self.mato.sijainti[0];

        // Talleta nykyinen pään sijainti ja laske uuden pään sijainti
        var pituus = self.mato.sijainti.length;
        var wanhaPaa = self.mato.sijainti[pituus-1];
        var uusiPaa = self.mato.sijainti[pituus-1] + muutos;

        // Käsittele pelilaudan reunojen ylitykset
        // TODO: switch case
        if (self.mato.suunta == "oikea" &&
            0 == (uusiPaa % self.pelialue.leveys) &&
            0 != uusiPaa ){
            uusiPaa = wanhaPaa - (self.pelialue.leveys-1);
        }
        if (self.mato.suunta == "vasen" && 0 == (wanhaPaa % (self.pelialue.leveys))) {
            uusiPaa = wanhaPaa + (self.pelialue.leveys-1);
        }
        if (self.mato.suunta == "ylos" && wanhaPaa < self.pelialue.leveys) {
            uusiPaa = wanhaPaa + (self.pelialue.korkeus * (self.pelialue.leveys-1));
        }
        if (self.mato.suunta == "alas" && wanhaPaa >= (self.pelialue.leveys*(self.pelialue.korkeus - 1))) {
            uusiPaa = wanhaPaa % (self.pelialue.leveys);
        }

        console.log("suunta", self.mato.suunta, " wanhaPaa:", wanhaPaa, "uusiPaa:", uusiPaa);
        // Tarkista osuimmeko ruokaan
        /*if (//document.getElementById(uusiPaa).bgColor == self.ruoka.vari) {
            // Osuimme, kasvata matoa
            self.mato.sijainti.push(uusiPaa);
            self.poistaRuoka(uusiPaa);

            // Kasvata pistemäärää
            self.mato.pisteet++;
        }
        else if (//document.getElementById(uusiPaa).bgColor == self.mato.vari) {
            // TODO: lopeta peli
            clearInterval(self.ajastin);
            alert("Bite me Elmo! Pisteitä " + self.mato.pisteet);
            location.reload();   // Lataa sivu uudemman kerran (ei kovin elegantti tapa)
        }
        else {
            // Emme osuneet, aseta uusi pää ja leikkaa pala hännästä
            self.mato.sijainti.push(uusiPaa);
            self.mato.sijainti.shift();
            // Poista häntä taulukosta
            //document.getElementById(hanta).bgColor = self.pelialue.vari;
        }

        //console.log(self.mato.sijainti)
        // Renderöi uusi mato
        for (var x=0;x<self.mato.sijainti.length; x++) {
            //document.getElementById(self.mato.sijainti[x]).bgColor = self.mato.vari;
        }

        // Päivitä pistetilanne
        //document.getElementById("pistetilanne").innerHTML = "Pisteesi: " + self.mato.pisteet.toString();
        */
    }

    self.alusta();
}

module.exports = Peli;