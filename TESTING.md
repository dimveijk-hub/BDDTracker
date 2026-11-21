# Testen tegen een eigen Firebase-testproject

Doel: de reconstructie uitproberen met echte Firebase Auth + Firestore, **zonder** productie of echte data te raken.
Alles hieronder gebeurt in een apart, gratis (Spark) Firebase-project.

## 1. Testproject aanmaken (Firebase Console, door jou)

1. https://console.firebase.google.com → **Project toevoegen**, naam bijv. `saleswise-tracker-test`. Google Analytics uit.
2. **Build → Authentication → Aan de slag → Aanmeldmethode → E-mail/wachtwoord** inschakelen.
3. **Build → Firestore Database → Database maken**, regio bijv. `europe-west4`, start in *productiemodus*.
4. Firestore → tabblad **Regels**: plak de inhoud van [`firestore.rules`](firestore.rules) → **Publiceren**.

## 2. Web-app registreren en config invullen

1. Projectinstellingen (tandwiel) → **Algemeen → Je apps → Web (`</>`)** → app registreren (hosting niet nodig).
2. Kopieer `.env.staging.local.example` naar `.env.staging.local` en vul de zes waarden uit de getoonde `firebaseConfig` in.
   Dit bestand wordt niet gecommit.

## 3. Testdata laden

1. Projectinstellingen → **Serviceaccounts → Nieuwe persoonlijke sleutel genereren**. Bewaar het JSON-bestand
   **buiten deze map** (bijv. in Downloads) en deel het met niemand; het geeft volledige toegang tot het testproject.
2. In de terminal (kies zelf een testwachtwoord van min. 8 tekens):

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/<jouw-sleutelbestand>.json"
   SEED_PASSWORD='kies-een-testwachtwoord' npm run seed
   ```

   Het script weigert te draaien als de sleutel bij het productieproject `saleswisetracker` hoort.
   Het maakt admin `admin@saleswise.eu` (of zet `SEED_ADMIN_EMAIL=jouw@adres`) en 9 bellers aan, met alle gebruikers
   op hetzelfde testwachtwoord, plus teams, twee afgesloten sessies en afspraken.

## 4. Draaien

```bash
npm run dev:staging      # http://localhost:3000 met label "TESTOMGEVING"
npm run build:staging    # test-build in dist-staging/ (nooit naar productie uploaden)
```

`npm run dev` en `npm run build` gebruiken nooit de testconfig.

## 5. Wat te controleren

- Inloggen als admin en als beller; verkeerd wachtwoord geeft een foutmelding.
- Beller zonder profiel-document ziet "Profiel niet gevonden".
- Sessie starten → bellers zien het formulier; afspraak registreren; sessie sluiten; blind mode.
- Targets live aanpassen, concept-targets opslaan en terugzien na herladen.
- Admin → nieuwe gebruiker uitnodigen (gebruik een eigen e-mailadres: Firebase mailt een wachtwoord-reset-link),
  team aanmaken, team toewijzen, gebruiker verwijderen.
- Rechten: een beller mag geen sessies/targets/profielen wijzigen en geen afspraak op andermans naam maken.
