PUBBANKO UNLIMITED - LINUX TESTVERSION

Start den med:
  chmod +x setup.sh
  ./setup.sh

setup.sh bruger run.sh, som kun bygger runtime igen naar Banko-pakken eller integrationspatchene er aendret.

Denne version indeholder bl.a.:
- klassiske 90-tals Banko-plader
- bartender/host-side
- Banko AKTIV / IKKE AKTIV styret af bartenderen
- Pub-ID foelger automatisk med fra mobilmenuen
- spilleren skriver kun et visningsnavn
- efter tilmelding vaelger spilleren 1-6 plader paa telefonen
- spillerens pladeoenske sendes til bartenderen, som godkender eller retter antal plader
- test-flowet traekker IKKE penge, klip eller Pub-ID-kredit
- beskyttelse af host-funktioner med bartender-PIN
- status-endpoint /api/status til mobilmenu/POS
- auto-traek hvert 10. eller 20. sekund
- serverstyret BANKO-kontrol
- tydelig fuldskaermbesked paa spillertelefonerne, naar nogen trykker BANKO
- systemet viser foerst at BANKO bliver kontrolleret
- ved forkert BANKO vises "DER VAR IKKE BANKO"
- derefter taeller spillertelefonerne ned fra 10 sekunder
- naar nedtaellingen er faerdig, traekkes naeste tal automatisk
- hvis auto-traek var i gang, fortsaetter det bagefter med samme interval
- ved gyldig BANKO stoppes traekningen og spillerne bedes vente paa bartenderen

VIGTIGT:
Dette er en testversion. Betaling, klip, Pub-ID-kredit og praemier med oekonomisk vaerdi skal ikke aktiveres, foer den konkrete model og noedvendige tilladelser er afklaret.
Se BARTENDER_REGLER.md.
