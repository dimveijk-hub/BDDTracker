# Reconstructie van de productie-broncode

De broncode van wat op https://bdd.saleswise.eu draait stond op een pc die is gecrasht en is nooit naar GitHub
gepusht; de GitHub-`main` bevatte alleen een vroeg prototype (mock-data, geen login). Deze branch
(`prod-reconstruction`) is **opnieuw opgebouwd uit de gepubliceerde bundel** `assets/index-GMg1RkxW.js` (3 feb 2026).

## Hoe

- Bundel opgehaald via de publieke URL, het app-deel (≈430 KB, na de Firebase-config) met Prettier leesbaar gemaakt.
- Datalaag (collecties, velden, schrijfacties), alle schermen, teksten, kleuren en berekeningen zijn uit die code
  overgenomen. Variabelenamen zijn opnieuw bedacht; JSX is opgeschoond (dubbele code in kleine componenten gezet).
- Componenten die al in de oude repo stonden hebben dezelfde bestandsnamen, de rest is nieuw
  (`Login`, `AuthContext`, `services/firestore.ts`, ...).

## Wat is getest

- `tsc --noEmit` en `vite build`: schoon.
- Doorlopen in **demo-modus** (in-memory data): inloggen als admin en beller, sessie starten/sluiten, blind mode,
  afspraak registreren, dashboard, leaderboard, resultaten (sessie/kwartaal), admin-tab, beller-samenvatting.

## Wat is NIET getest (belangrijk voor de overzetting)

- **Niet tegen echt Firebase.** Auth, Firestore-queries/-rechten en het uitnodigen van gebruikers (tweede
  Firebase-app + wachtwoord-reset-mail) zijn niet uitgeprobeerd; daar was geen login/testproject voor.
- Pixel-vergelijking met productie is niet gedaan (productie vereist een login).
- Firestore Security Rules en de bestaande data staan niet in deze repo; ze zitten in de Firebase Console.

## Bewuste afwijkingen van productie

| Onderwerp | Productie | Hier |
|---|---|---|
| "Targets opslaan" in nieuwe-sessie-formulier | knop blijft na opslaan op "✓ opgeslagen" en disabled hangen (stale closure) | reset na 2 s; bij fout meteen terug naar idle |
| Kwartaal-keuzelijst | vast 2025 en 2026 (breekt in 2027) | 2025 t/m volgend jaar |
| Resultaten: kwartaallijst | filter op `2025`/`2026` | alle kwartalen vanaf 2025 |
| Target = 0 bij beller-samenvatting | deling door 0 | 0% |
| Tijdelijk wachtwoord bij uitnodigen | `Math.random()` | `crypto.getRandomValues` (wordt direct vervangen via reset-mail) |
| "Profiel niet gevonden"-scherm | adviseert Firestore-regels op `allow read, write: if true` te zetten | adviseert alleen de regels te controleren (nooit open zetten) |
| Doelwaarde-invoer lopende sessie | verouderde waarde als target elders wijzigt | invoer herlaadt bij externe wijziging |
| Lege `value` op target-invoer | React-waarschuwing | opgelost |

Bekend gedrag dat bewust gelijk is gebleven: de "Kwartaal"-knop van het leaderboard telt álle sessies, niet alleen
het huidige kwartaal; de tabbladen zijn onder de `md`-breakpoint verborgen (geen mobiele navigatie).

## Veilig overzetten (voorstel)

1. Maak een **test-Firebase-project** (of gebruik het bestaande met een eigen test-admin) en publiceer de build op een
   aparte URL/map op de FTP, bijv. `bdd-test` - niet op de productie-root.
2. Loop de schermen naast de live-versie door (dashboard, sessie starten/sluiten, blind mode, afspraak, resultaten,
   gebruiker uitnodigen, teams) en vergelijk.
3. Pas als dat klopt: back-up van de huidige FTP-inhoud nemen (`index.html`, `logo.png`, `assets/`) en dán `dist/`
   uploaden. Terugdraaien = back-up terugzetten.
4. Commit de broncode naar GitHub, zodat dit niet nog eens gebeurt.

## Aandachtspunten buiten de code

- Controleer in de Firebase Console de **Firestore Security Rules** (de oude UI verwees naar `if true`).
- De FTP-gegevens zijn in een chat gedeeld en FTP is onversleuteld: laat het wachtwoord vernieuwen en gebruik zo
  mogelijk SFTP/FTPS.
- `npm audit` meldt 4 hoge kwetsbaarheden in `@grpc/grpc-js` (transitief via Firebase, server-side; niet relevant
  voor de browserbundel).
