# Golden Spreads — Arabic / English implementation

## What changed

- Added a persistent English / Arabic language switch in the main navigation.
- English remains the default language for first-time visitors.
- The selected language is stored in `localStorage` under `golden-spreads-language`.
- Arabic mode sets the document language to `ar`, switches the document direction to RTL, and uses the Tajawal font.
- Added a centralized English-to-Arabic translation dictionary in `src/lib/LanguageContext.js`.
- The translation layer covers the homepage, product cards, brand story, quality report section, community slider, footer, chatbot interface and replies, Golden Rewards customer wallet, and the admin rewards dashboard.
- Added Arabic styling overrides in `src/Styles/Language.css`.
- Localized the administrator's permanent-deletion confirmation prompt as well.
- Existing authentication, database calls, reward calculations, redemption logic, and purchase recovery behavior were not changed.

## How to run locally

Open PowerShell in:

`C:\Users\buffi\Desktop\Golden Spreads\frontend`

Confirm the folder:

```powershell
Get-Location
```

Then run:

```powershell
npm start
```

Open `http://localhost:3000`.

## How to add or correct a translation

Open `src/lib/LanguageContext.js` and add an entry to the `translations` object:

```js
"English text exactly as it appears": "النص العربي";
```

Keep the English source text as the key. The translation layer also handles known phrases inside dynamic admin messages while leaving email addresses, URLs, IDs, OTPs, and numeric values unchanged.
