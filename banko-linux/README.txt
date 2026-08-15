PUBBANKO UNLIMITED

NYT I DENNE VERSION
- Ingen fast begrænsning på antal spillere
- Inputfeltet for antal plader har ikke længere max-grænse i host-viewet
- Serveren accepterer nu meget høje antal plader pr. spiller
- Unikke plader pr. runde er bevaret
- Reconnect, host-kontrol og præmieberegner er bevaret

VIGTIGT
- Der er ingen praktisk grænse på antal spillere i koden
- Antal plader pr. spiller er hævet kraftigt
- Meget høje tal kan stadig gøre telefoner og pc langsomme, fordi alle plader skal vises og synkroniseres

NYT - LINUX + AUTO-TRÆK
- Linux-start via setup.sh
- Værten kan vælge auto-træk hvert 10. eller 20. sekund
- Auto-træk kan startes og stoppes under spillet
- Intervallet kan skiftes mens auto-træk kører
- Nulstil spil stopper altid auto-træk, så en ny runde ikke starter ved et uheld
- Auto-træk stopper automatisk, når alle 90 numre er trukket

JURIDISK SIKKERHED I DENNE TESTVERSION
- Bartendersiden viser en tydelig regel/advarselsboks før spilkontrollerne
- Versionen er markeret som TESTVERSION
- Den må ikke bruges til betalt Banko eller gevinster, før den konkrete model og nødvendige tilladelser er afklaret
- De gældende regler for landbaseret Banko kræver bl.a. fysiske spilleplader og manuel dupning; derfor er mobilpladerne ikke automatisk omfattet som lovligt landbaseret Banko
- Se BARTENDER_REGLER.md for kilder og den korte bartender-tjekliste

INSTALLATION
- Kør: chmod +x setup.sh
- Kør: ./setup.sh
- setup.sh samler automatisk server.js fra kildefragmenterne og installerer npm-pakkerne.
