# BDD Tracker (SalesWise Business Development Day)

Live dashboard waarmee bellers tijdens een Business Development Day afspraken registreren en admins sessies,
targets en resultaten beheren. React 19 + TypeScript + Vite, Firebase (Auth + Firestore), Recharts, Tailwind (CDN).

Productie: https://bdd.saleswise.eu (statische build via FTP). Zie [RECONSTRUCTION.md](RECONSTRUCTION.md) voor de
herkomst van deze broncode.

## Lokaal draaien

```bash
npm install
npm run dev:demo   # in-memory demo, geen Firebase nodig (admin@saleswise.eu / mark.visser@saleswise.eu, elk wachtwoord)
npm run dev        # echte Firebase-backend (productiedata!)
npm run typecheck
npm run build      # output in dist/
```

> `npm run dev` praat met het **productie**-Firebase-project `saleswisetracker`. Gebruik voor experimenten liever
> `dev:demo` of een eigen test-project (config in `firebase.ts`).

## Opbouw

| Pad | Inhoud |
|---|---|
| `App.tsx` | Auth-gate, live Firestore-subscriptions, dashboard-logica, navigatie |
| `components/` | `DashboardStats`, `AppointmentForm`, `AdminPanel` (sessies/targets/blind mode), `Leaderboard`, `AppointmentLog`, `ResultsDashboard`, `OrganizationPanel` (gebruikers/teams), `Login` |
| `services/firestore.ts` | Alle Firestore/Auth-aanroepen |
| `services/demo.ts` | Zelfde API in-memory (alleen `dev:demo`) |
| `contexts/AuthContext.tsx` | Ingelogde gebruiker + profiel (`profiles/{uid}`) |

Firestore-collecties: `teams`, `profiles` (doc-id = Auth uid), `sessions`, `session_targets`, `appointments`,
`settings/global` (`active_session_id`, `blind_mode_enabled`) en `settings/drafts` (concept-targets).

## Deploy

`npm run build`, daarna de **inhoud** van `dist/` (`index.html`, `logo.png`, `assets/`) naar de FTP-root uploaden.
