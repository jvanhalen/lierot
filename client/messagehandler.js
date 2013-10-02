var MessageHandler = function() {
   var self = this;

   self.receive = function(msg) {
      console.log(msg);

      switch (msg.name) {

         case 'CHAT_SYNC':
               console.log("chat_sync");
               // jQuerystä löytyisi suoraan .append()-funktio, jolla saataisiin sisältöä "jatkettua"
               document.getElementById('viestialue').innerHTML += '<div id="viesti"><a href="#" title="viesti">'+ msg.username + ':</a>&nbsp;&nbsp;' + msg.text + '</div>';
               // Chatbox auto-scroll
               document.getElementById('keskustelualue').scrollTop += 20;
            break;

         case 'AUTH_REQ':
            console.log(msg.name, msg.response);
            break;

         case 'LOGIN_RESP':
            console.log(msg.name, msg.response);
            break;

         case 'REG_RESP':
            console.log(msg.name, msg.response);
            break;

         default:
            console.log("Default branch reached: ", msg);
            break;
      }
   }
}