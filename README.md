# SAPS Grade Book — Android (PWA)

Offline marks, totals, positions and grades for PNG primary schools.
Lower Primary (Grades 3–5): each assessment period (AP1, AP2) out of 100, subject total out of 200.
Upper Primary (Grades 6–8): each assessment period out of 200, subject total out of 400.
Final Results ranks the class on the grand total of all subjects.
Data stays on the phone; Excel is the link in and out (import class lists and marks, export mark sheets with live formulas).

## Files
- `index.html` — the whole app
- `xlsx.full.min.js` — Excel reader/writer (SheetJS 0.18.5), served locally so the app works offline
- `manifest.webmanifest`, `sw.js`, `icons/` — what makes it installable and offline

## 1. Host it (HTTPS is required)
**GitHub Pages:** new public repo (e.g. `saps-grade-book`) → upload everything in this folder to the root → Settings → Pages → Deploy from branch `main` / root.
App URL: `https://<username>.github.io/saps-grade-book/`

From Termux:
```
cd saps-grade-book
git init && git add . && git commit -m "SAPS Grade Book v1"
git branch -M main
git remote add origin https://github.com/<username>/saps-grade-book.git
git push -u origin main
```

## 2. Make the APK
1. Open https://www.pwabuilder.com and enter the app URL.
2. Package for stores → Android → Generate.
3. Package ID e.g. `com.readydigital.gradebook`, app name `SAPS Grade Book`.
4. Download the zip. Keep `signing.keystore` and `signing-key-info.txt` safe — you need the same key for every update.
5. Install the `.apk` on phones (allow "Install unknown apps"), or upload the `.aab` to Play Store.
6. For the full-screen app with no browser bar, put the generated `assetlinks.json` at `.well-known/assetlinks.json` on the site.

## Updating
Change the files, then bump `VERSION` in `sw.js` (e.g. `gradebook-v2`) and push. Phones pick up the update the next time the app opens online. The APK does not need rebuilding for content updates.

## Data safety
Marks live in the app's storage on each phone. Clearing app data or uninstalling deletes them.
Teachers should use **Settings → Save backup file** weekly (share to Google Drive / WhatsApp / email) and **Restore from backup** on a new phone.

## Version history
- v1.1 — AP1 and AP2 inside each class; subject Total (AP1 + AP2); Final Results page (all subjects, grand total, %, grade, placing); Excel export with linked AP, Total and Final Results sheets. Older backups load automatically (their tasks go into the period set on the class).
- v1.0 — first release.

## Licensing (one device per code)
- The app creates a Device ID (e.g. `GB-7K3M-Q9TX`) per install. Without a valid code it runs as a trial: 1 class, 2 subjects, no Excel export/import, prints marked TRIAL.
- Codes are Ed25519 signatures made with RDC's private key using `gb-keygen.js` (kept OFF this repo). The app only holds the public key (`LICENSE_PUBKEY` in index.html), so codes cannot be forged from the app's code.
- `LICENSE_PUBKEY = ''` switches licensing off.
