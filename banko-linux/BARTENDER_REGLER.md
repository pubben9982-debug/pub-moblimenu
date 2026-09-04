# Bartender-regler – Banko (arbejdsnotat)

**Status: 4. september 2026**

Dette er en kort driftsadvarsel til Banko-testen. Den er ikke en erstatning for en konkret tilladelse eller juridisk vurdering.

## Før et spil startes

1. **TESTVERSION:** Brug ikke den nuværende mobilversion til betalt Banko eller spil med gevinster, før Pubben har fået den konkrete model afklaret.
2. Landbaseret lotteri med en samlet salgssum **under 15.000 kr. over en periode på 12 måneder** kan efter spillelovens § 3, stk. 3, afholdes uden tilladelse. Grænsen gælder hele det beløb, spillerne betaler for plader/deltagelse, ikke arrangørens fortjeneste eller gevinsternes værdi. Ved 15.000 kr. eller derover kræves en relevant tilladelse.
3. Ved landbaseret Banko skal spillerne være fysisk til stede i samme lokale som opråberen.
4. Personer under 18 år må ikke få adgang til lokaler, hvor der afholdes landbaseret Banko.
5. Landbaseret Banko må afvikles dagligt mellem kl. 07.00 og 24.00, og der skal være bemanding til stede i hele åbningstiden.
6. Vindernumre skal trækkes ét ad gangen. Trækningen skal ske ved mulig deltageroverværelse eller ved brug af en certificeret tilfældighedsgenerator.
7. **Vigtigt for vores mobilversion:** Det udtrykkelige krav om fysiske spilleplader findes i bekendtgørelse nr. 1439 om landbaseret bingo med tilladelse efter spillelovens § 10 a. Bekendtgørelsen angiver selv dette anvendelsesområde. Der er ikke fundet et tilsvarende udtrykkeligt forbud mod elektroniske plader i bagatelreglen i § 3, stk. 3. Vores model skal være et lokalt spil med spillere og opråber fysisk til stede i samme lokale, ikke et åbent online-/fjernspil. Myndighedernes endelige fortolkning af elektroniske plader under bagatelreglen er fortsat uafklaret.
8. Spilleren kan i testversionen vælge 1-6 plader på telefonen. Dette er kun en gratis bestilling til bartenderen; der må ikke trækkes penge, klip eller Pub-ID-kredit.

## Officielle kilder

- Lotteriregler.dk – Årlig salgssum under 15.000 kr.: https://lotteriregler.dk/arlig-salgssum-under-15000-kr
- Retsinformation – lov nr. 1177 af 19. november 2024, herunder spillelovens § 3, stk. 3: https://www.retsinformation.dk/eli/lta/2024/1177/pdf
- Retsinformation – bekendtgørelse nr. 1439 om landbaseret bingo (§ 1, § 3 og § 5): https://www.retsinformation.dk/eli/lta/2024/1439/pdf
- Spillemyndigheden – Landbaseret bingo: https://spillemyndigheden.dk/virksomheder-og-foreninger/spil-der-kraever-en-tilladelse/landbaseret-bingo
- Spillemyndigheden – Vejledning om landbaseret bingo, version november 2025: https://spillemyndigheden.dk/vejledninger/vejledning-om-landbaseret-bingo
- Spillemyndigheden – Onlinekasino (onlinebingo er omfattet): https://www.spillemyndigheden.dk/onlinekasino

## Leverandørmodel til andre beværtninger

- Milo-systemet kan fungere som leverandør af på forhånd oprettede, unikke elektroniske plader, ID-registrering og teknisk drift til selvstændige beværtninger.
- Den enkelte beværtning skal reelt være arrangør: modtage spillernes betaling, fastsætte og udlevere gevinster samt føre sin egen salgslog.
- Leverandøren fakturerer beværtningen pr. anvendt plade eller som en systemydelse og modtager ikke betaling direkte fra spillerne.
- Hver selvstændig arrangør holder sin egen samlede salgssum under 15.000 kr. i den løbende 12-månedersperiode. Hvis samme virksomhed/CVR driver flere steder, behandles de forsigtigt som én arrangør med én samlet grænse, indtil andet er skriftligt afklaret.
- Eksempel: Betaler spilleren 2 kr. pr. plade, tæller alle 2 kr. med, selv om 1 kr. betales videre til systemleverandøren. Højst 7.499 plader giver 14.998 kr. og holder sig under grænsen.
- Der skal senere bygges tæller og advarsler pr. arrangør samt stop for yderligere betalt deltagelse, før grænsen nås. Gratis banko kan kun bruges som reserve, hvis deltagelsen er reelt gratis og ikke betinget af et andet køb.
- Før bred kommerciel udrulning bør Spillemyndigheden spørges specifikt, om elektroniske plader på deltagernes egne telefoner accepteres ved lokalt lotteri under § 3, stk. 3.

## Produktregel

Betaling, automatisk fratræk af kredit/klip og automatisk tildeling af præmier skal holdes adskilt fra Banko-motoren, indtil den juridiske model er afklaret. Pladevalget må gerne testes som gratis flow, men må ikke kalde eller debitere Pub-ID-kredit.

## Forberedt gavekortflow

Koden indeholder et testflow til fysiske gavekort, men det er slået fra som standard. Det må ikke åbnes til gevinster med økonomisk værdi, før den konkrete Banko-model er afklaret.

Når det senere må aktiveres, gemmer flowet kun Pub-ID, gavekortbeløb, valgt butik, status og en hash af telefonens Banko-nøgle. Der gemmes ikke gæstenavn eller rå telefonnøgle. Status er: afventer butiksvalg, bestilt, hentet og udleveret.
