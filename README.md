# PayEase — Simple. Secure. Smart.

A college-project payment app prototype built with React, Vite and Firebase.

## Included
- Firebase Email/Password Authentication
- Firestore user profiles and transaction history
- Secure Firestore rules
- Demo wallet ledger (does not move real bank money)
- QR/camera permission and QR scanning
- Browser notification permission
- Responsive dashboard, history and profile
- Firebase Cloud Function for server-side demo payment recording
- Firebase Hosting configuration

## Run locally
1. Open this folder in VS Code.
2. `npm install`
3. `npm run dev`
4. Open the Vite URL.

The supplied `.env` is configured for the PayEase Firebase web app. For GitHub, `.env` is ignored. If it is missing, copy `.env.example` to `.env` and enter your Firebase Web App config.

## Firebase setup
Enable Authentication → Sign-in method → Email/Password.
Create Firestore Database.
Replace Test Mode rules with the included `firestore.rules` and publish them.

For Cloud Functions, install Firebase CLI and use a Firebase project that permits Cloud Functions deployment. Functions may require the appropriate Firebase billing plan.

## Important security scope
This is an academic/demo wallet. It does not connect to a bank, UPI rail, card network or real-money payment gateway. Never collect real card PINs, CVVs, passwords, OTPs or bank credentials in this project.

## Build
`npm run build`

## Deploy hosting
`npm run build`
`firebase login`
`firebase use payease-3b61f`
`firebase deploy --only hosting,firestore`

## Functions (optional)
From the project root: `firebase deploy --only functions`
