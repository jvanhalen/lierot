// Sama koodi pitää toimia clientiessä ja serverissä, siksi tällainen funktiomäärittely
(function(exports){

    message = {
        id: "1",

        CHAT_SYNC: {
            message: {
                name: "CHAT_SYNC",
                username: null,  // Keneltä viesti tuli (username)
                text: null       // Viestin sisältö
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        AUTH_REQ: {
            message: {
                name: "AUTH_REQ",   // Client lähettää tämän palvelimelle
                username: null,     // Clientin käyttäjänimi (lue html-lomakkeesta)
                passwordhash: null  // SHA1-koodattu salasanatiiviste (lue html-lomakkeesta ja generoi SHA1-tiiviste)
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        AUTH_RESP: {
            message: {
                name: "AUTH_RESP",  // Palvelin vastaa clientille
                response: "OK/NOK"
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PING: {
            message: {
                name: "PING",
                value: 0    // Satunnainen merkkijono, vastaus samalla numerolla
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PONG: {
            message: {
                name: "PONG",
                value: 0      // Palvelimen generoima merkkijono, vastaus samalla merkkijonolla
            },
            new: function() {
                // Luo uusi kopio tästä viestistä
                return JSON.parse(JSON.stringify(this.message));
            }
        }
    }

    exports.message = message;

})(typeof exports === 'undefined'? this['messages']={}: exports);