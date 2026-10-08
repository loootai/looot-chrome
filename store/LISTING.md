# Chrome Web Store listing: looot-chrome 0.1.0

Paste each field into the developer dashboard. Character counts are checked against the store limits.

## Package

`store/looot-chrome-0.1.0.zip` (built by `npm run build && npm run pack`).

## Store listing tab

**Name** (31 of 45 characters; read from the manifest)

```
looot: company and email lookup
```

**Summary** (115 of 132 characters; read from the manifest)

```
Search 2,500+ data APIs with prices. Enrich the company or find a work email for the site you are on. Pay per call.
```

**Description**

```
looot puts company and contact lookups in Chrome's side panel, with the price on screen before anything runs.

FREE, NO ACCOUNT
Search the looot catalog: 2,500+ data API endpoints from 90+ providers. Type a task such as "verify email" or "company news" and see each endpoint and what one call costs.

WITH YOUR OWN LOOOT TOKEN
Open the panel on a company's website and run a lookup on that domain:
- Enrich this company: name, industry, size, country, LinkedIn.
- Find work email: type a first and last name, get the address at this domain, then a deliverability check.
- Tech stack: the technologies the company's website uses.

YOU CONTROL THE SPEND
- Every lookup shows its listed price and the most it can charge. Nothing runs until you click Confirm.
- After the run you see what was charged.
- A failed call costs $0.
- Set a cap per call (default $0.05) and a cap per browser session (default $0.50). The session total is always on screen.

PRIVACY
- Your token is stored in this browser's local extension storage. It is not synced and is sent only to api.looot.ai.
- The extension talks to api.looot.ai and no other server. No analytics, no tracking.
- It does not read page content. It reads the address of the tab you opened it on, to get the company's domain, and sends that domain only when you confirm a lookup.

looot is pay per call with no subscription. Top up from $5 at https://looot.ai.

Open source (MIT): https://github.com/loootai/looot-chrome
Docs: https://docs.looot.ai
```

**Category**: Workflow & Planning (under Productivity). Second choice: Developer Tools.

**Language**: English

**Store icon** (128x128): `public/icons/icon-128.png`

**Screenshots** (1280x800, upload in this order):

1. `store/screenshots/1-catalog-search.png`
2. `store/screenshots/2-price-before-run.png`
3. `store/screenshots/3-company-enriched.png`
4. `store/screenshots/4-work-email.png`
5. `store/screenshots/5-limits-and-token.png`

**Small promo tile** (440x280): `store/promo-small-440x280.png`

**Marquee promo tile** (1400x560): `store/promo-marquee-1400x560.png`

**Additional fields**

| Field | Value |
| --- | --- |
| Official URL | looot.ai (pick it from the list; it shows once looot.ai is verified in Google Search Console with the same Google account) |
| Homepage URL | https://looot.ai |
| Support URL | https://looot.ai/contact |

The Homepage URL is the website link shown on the public listing.

## Privacy practices tab

**Single purpose**

```
Look up business data about the company whose website is open in the current tab (company profile, a work email, tech stack) and search the looot data API catalog, from the side panel, with the price shown before each paid lookup.
```

**Permission justifications**

sidePanel

```
The whole interface is one side panel page. It opens when the user clicks the toolbar icon.
```

storage

```
chrome.storage.local keeps the user's own looot API token and two spending limits on this device. chrome.storage.session keeps the amount spent in this browser session and a 30 minute cache of four public prices. Nothing is synced.
```

activeTab

```
When the user clicks the toolbar icon, the panel reads that tab's URL once to get the company's domain (for example example.com), so the user does not have to type it. No page content is read and no script is injected.
```

Host permission https://api.looot.ai/*

```
The panel calls the looot REST API from the extension page: free catalog search and prices, and, when the user confirms a lookup, the paid run with the user's token. This is the only host the extension contacts; the manifest's content security policy limits connections to it.
```

**Remote code**: No, I am not using remote code. All JavaScript is in the package; there is no eval and no script loaded from a server.

**Data usage** (tick these, leave the rest empty)

- Authentication information: the user's looot API token. Stored locally, sent only to api.looot.ai in the Authorization header.
- Personally identifiable information: the first and last name the user types for "Find work email", and the email address returned. Sent to api.looot.ai only when the user confirms that lookup.
- Web history: the domain of the current tab. Sent to api.looot.ai only when the user confirms a lookup on it. No browsing history is collected in the background.

Not collected: health, financial and payment information, personal communications, location, user activity, website content.

**Certifications** (tick all three; each is true for this build)

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**: https://looot.ai/privacy

## Distribution tab

Visibility Public, all regions, free. "Contains in-app purchases": no (looot credit is bought on looot.ai, not in the extension).

## Notes for the reviewer (Test instructions field)

```
Catalog search (Catalog tab) works with no account. The three lookups need a looot API token from https://looot.ai/settings (Agent tokens). Without a token the Lookup tab shows a notice and the lookups stay disabled. A test token can be provided on request: https://looot.ai/contact
```
