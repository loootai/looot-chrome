# Changelog

## 0.3.0 (2026-11-01)

- New name: Whozit (by looot). Store title "Whozit: Who Owns This Website, Company Lookup & Email Finder", localized in seven languages.
- The panel reads the tab's URL and title (no content script, no new permission) and tells the page kind: company website, team page, article, LinkedIn profile, LinkedIn company page. It puts the lookups that fit first and the rest under "More lookups".
- New lookups: LinkedIn profile (`linkedin.person.profile`), Recent news (`news.search`), Verify an email (`people.email.verify` on its own). Work email runs from the LinkedIn profile you are on. Company lookup works on a LinkedIn company page.
- Readers look inside provider wrappers (`data`, `profile`, `person`) first, so a wrapper's own name field no longer wins.
- Store kit re-rendered: five English screenshots (company, LinkedIn profile, traffic, tech stack and news, team page price), one per other language, tiles, video. Zip is `store/whozit-<version>.zip`.

## 0.2.0 (2026-11-01)

- Company lookup for the open site: six lookups. New: Domain record (WHOIS, `domain.whois.lookup`), Website traffic (`company.traffic`), SEO and backlinks (`backlinks.domain.summary`). "Enrich this company" is now "Who owns this website".
- Seven languages through `_locales`: en, fr, de, es, it, nl, pt. Strings live in `scripts/strings.mjs`; `npm run locales` writes the message files and checks the store limits.
- Store name and summary come from `_locales` and target "company lookup" and "who owns this website".
- A lookup whose cheapest listed call is above the cap per call is disabled, with a link to Settings.
- Default caps raised to $0.10 per call and $1.00 per session, so the $0.06532 traffic call fits.
- Brand green #009362.
- Store kit: five English screenshots, one per other language, both promo tiles, a 21 s demo video, all from the real panel with demo data labelled as demo.

## 0.1.0 (2026-10-08)

- Side panel with free catalog search and three paid lookups on the current tab's domain: company enrichment, work email with a deliverability check, tech stack.
- Price shown before each paid call, confirm click, charged amount after, cap per call, session cap and counter.
- Store kit in `store/`.
