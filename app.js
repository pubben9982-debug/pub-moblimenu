/* KLIPPEKORT
   Sender samme Pub-ID som Jukebox og Poker.
   Går direkte til den lokale side.
*/

if (el("cardBtn")) {

  el("cardBtn").onclick = function () {

    const url =
      CONFIG.clipsUrl +
      "?id=" +
      encodeURIComponent(deviceId) +
      "&v=4";

    window.location.href = url;

  };

}
