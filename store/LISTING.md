# Chrome Web Store listing: Whozit by looot 0.3.0

Paste each field into the developer dashboard. Name and summary come from `public/_locales/<lang>/messages.json`
(the manifest uses `__MSG_extName__` and `__MSG_extDescription__`), so the dashboard shows them per language
on its own. The detailed description, screenshots and promo tiles are entered per language.

Name: Whozit, a short brand plus a keyword tail, the pattern Hunter, Wappalyzer and Similarweb use. The tail
targets "who owns this website" (2,400 US Google searches a month, store leader 15 users) and "company lookup"
(1,000, store leader 82 users), then "email finder" (8,100). The description reuses the words of the five
closest listings (Similarweb, Hunter, Wappalyzer, BuiltWith, Who Owns This Website?).

## Package

`store/whozit-0.3.0.zip` (built by `npm run build && npm run pack`).

## Name and summary per language (from `_locales`)

| Lang | Name (75 max) | Summary (132 max) |
| --- | --- | --- |
| en | Whozit: Who Owns This Website, Company Lookup & Email Finder | Site and people intel on any page: who owns the website, company, tech stack, traffic, LinkedIn profile, work email, news. |
| fr | Whozit : à qui appartient ce site, recherche d'entreprise, e-mail | Infos sur le site et les personnes : propriétaire du site, entreprise, technos, trafic, profil LinkedIn, e-mail pro, actualités. |
| de | Whozit: Wem gehört diese Website? Firmensuche & E-Mail-Finder | Infos zu Website und Personen: Inhaber, Firma, Tech-Stack, Traffic, LinkedIn-Profil, Firmen-E-Mail, News. Preis vor jedem Abruf. |
| es | Whozit: de quién es esta web, buscar empresa y email | Datos del sitio y de personas: dueño de la web, empresa, tecnologías, tráfico, perfil de LinkedIn, email de trabajo, noticias. |
| it | Whozit: di chi è questo sito, ricerca aziende ed email | Info su sito e persone: proprietario del sito, azienda, tecnologie, traffico, profilo LinkedIn, email di lavoro, notizie. |
| nl | Whozit: van wie is deze website, bedrijf opzoeken en e-mail | Info over site en mensen: eigenaar van de website, bedrijf, techstack, verkeer, LinkedIn-profiel, zakelijke e-mail, nieuws. |
| pt | Whozit: de quem é este site, pesquisa de empresas e e-mail | Dados do site e de pessoas: dono do site, empresa, tecnologias, tráfego, perfil do LinkedIn, e-mail de trabalho, notícias. |

## Detailed description

### en

```
Whozit, by looot, is site and people intel in Chrome's side panel. Open it on any page and it works out what you are looking at, a company website, a team page, an article, a LinkedIn profile or a LinkedIn company page, and puts the right lookups first. The price shows before anything runs.

ON A COMPANY WEBSITE
- Who owns this website: the company behind the domain. Name, industry, employee count, founding year, country, city, LinkedIn page, description.
- Tech stack detector: CMS, analytics, payments, hosting, chat and support tools the site uses.
- Website traffic checker: estimated monthly visits, global and country rank, bounce rate, pages per visit, time on site, traffic sources.
- SEO and backlinks: domain rank, backlinks, referring domains, spam score.
- Domain record (WHOIS): registrar, creation and expiry dates, domain age, name servers.
- Recent news about the company.

ON A PERSON OR TEAM PAGE
- LinkedIn profile: headline, current role, location, followers, school.
- Work email finder: from a name at the site's domain, or straight from the LinkedIn profile you are on, then a deliverability check.
- Verify an email: valid, invalid, catch-all or risky.

FREE, NO ACCOUNT
The Catalog tab searches the looot catalog of 4,200+ data API endpoints from 300+ providers, with the price of one call.

YOU SEE THE PRICE FIRST
- Every lookup shows its listed price and the most it can charge. Nothing runs until you click Confirm.
- After the run you see what was charged. A failed call costs $0.
- Cap per call (default $0.10) and per browser session (default $1.00). The session total is always on screen.
- No subscription. Bring your own looot API key and pay per call from a prepaid balance. Top-ups start at $5 on looot.ai.

PRIVACY
- Three permissions: side panel, storage, active tab. One host: api.looot.ai.
- No content scripts. Whozit reads only the address and title of the tab you opened it on, never the page content, cookies or your LinkedIn session.
- It sends a domain, profile URL, name or email to api.looot.ai only when you confirm that lookup.
- Your key stays in this browser's local extension storage, not synced. No analytics, no tracking.

GOOD TO KNOW
Traffic numbers are estimates from a traffic panel, not the site's own analytics. Data can be missing for small or new companies; the panel says so, and a failed call costs $0.

LANGUAGES
English, French, German, Spanish, Italian, Dutch and Portuguese.

Open source (MIT): https://github.com/loootai/looot-chrome
Docs: https://docs.looot.ai
```

### fr

```
Whozit, par looot, donne des infos sur les sites et les personnes dans le panneau latéral de Chrome. Sur n'importe quelle page, il reconnaît ce que vous regardez (site d'entreprise, page équipe, article, profil ou page entreprise LinkedIn) et propose les bonnes recherches en premier. Le prix s'affiche avant chaque appel.

SUR UN SITE D'ENTREPRISE
- À qui appartient ce site : nom, secteur, effectif, année de création, pays, ville, LinkedIn.
- Technologies utilisées : CMS, analytics, paiement, hébergement.
- Trafic du site : visites mensuelles estimées, rang mondial et national, taux de rebond, sources de trafic.
- SEO et backlinks, fiche du domaine (WHOIS), actualités récentes.

SUR UNE PERSONNE
- Profil LinkedIn : titre, poste, lieu, abonnés, école.
- E-mail pro à partir d'un nom ou du profil LinkedIn ouvert, puis test de délivrabilité.
- Vérifier un e-mail.

LE PRIX D'ABORD
Rien ne part sans votre confirmation. Un appel en échec coûte 0 $. Plafond par appel (0,10 $) et par session (1,00 $). Sans abonnement : votre clé looot et un solde prépayé, recharge dès 5 $. Catalogue gratuit de 4 200+ endpoints.

CONFIDENTIALITÉ
Trois permissions et un seul hôte, api.looot.ai. Aucun script injecté, aucun contenu de page lu. Pas d'analytics.

Code source (MIT) : https://github.com/loootai/looot-chrome
```

### de

```
Whozit von looot liefert Infos zu Websites und Personen im Seitenbereich von Chrome. Auf jeder Seite erkennt es, was Sie ansehen (Firmen-Website, Team-Seite, Artikel, LinkedIn-Profil oder -Firmenseite), und zeigt die passenden Abfragen zuerst. Der Preis steht vor jedem Abruf da.

AUF EINER FIRMEN-WEBSITE
- Wem gehört diese Website: Name, Branche, Mitarbeiterzahl, Gründungsjahr, Land, Stadt, LinkedIn.
- Tech-Stack: CMS, Analytics, Zahlungen, Hosting.
- Website-Traffic: geschätzte Besuche pro Monat, Rang, Absprungrate, Traffic-Quellen.
- SEO und Backlinks, Domain-Eintrag (WHOIS), aktuelle News.

ZU EINER PERSON
- LinkedIn-Profil: Headline, Rolle, Ort, Follower, Hochschule.
- Firmen-E-Mail aus einem Namen oder dem offenen LinkedIn-Profil, dann Zustellbarkeitsprüfung.
- E-Mail prüfen.

ERST DER PREIS
Nichts läuft ohne Bestätigung. Ein fehlgeschlagener Abruf kostet 0 $. Limit pro Abruf (0,10 $) und pro Sitzung (1,00 $). Kein Abo: eigener looot-Schlüssel und Prepaid-Guthaben ab 5 $. Kostenloser Katalog mit 4.200+ Endpunkten.

DATENSCHUTZ
Drei Berechtigungen, ein Host: api.looot.ai. Keine Content-Skripte, kein Seiteninhalt wird gelesen. Keine Analytics.

Quellcode (MIT): https://github.com/loootai/looot-chrome
```

### es

```
Whozit, de looot, da datos de sitios y personas en el panel lateral de Chrome. En cualquier página reconoce lo que miras (web de empresa, página del equipo, artículo, perfil o página de empresa en LinkedIn) y pone primero las consultas adecuadas. El precio aparece antes de cada consulta.

EN UNA WEB DE EMPRESA
- De quién es esta web: nombre, sector, empleados, año de fundación, país, ciudad, LinkedIn.
- Tecnologías: CMS, analítica, pagos, alojamiento.
- Tráfico web: visitas mensuales estimadas, ranking, tasa de rebote, fuentes de tráfico.
- SEO y backlinks, registro del dominio (WHOIS), noticias recientes.

SOBRE UNA PERSONA
- Perfil de LinkedIn: titular, puesto, ubicación, seguidores, estudios.
- Email de trabajo a partir de un nombre o del perfil de LinkedIn abierto, con verificación de entrega.
- Verificar un email.

PRIMERO EL PRECIO
Nada se ejecuta sin tu confirmación. Una consulta fallida cuesta 0 $. Límite por consulta (0,10 $) y por sesión (1,00 $). Sin suscripción: tu clave de looot y saldo prepago desde 5 $. Catálogo gratis de 4.200+ endpoints.

PRIVACIDAD
Tres permisos y un solo host, api.looot.ai. Sin scripts en las páginas, no lee su contenido. Sin analítica.

Código abierto (MIT): https://github.com/loootai/looot-chrome
```

### it

```
Whozit, di looot, dà informazioni su siti e persone nel pannello laterale di Chrome. Su qualsiasi pagina riconosce cosa stai guardando (sito aziendale, pagina del team, articolo, profilo o pagina aziendale LinkedIn) e mette prima le ricerche giuste. Il prezzo appare prima di ogni chiamata.

SU UN SITO AZIENDALE
- Di chi è questo sito: nome, settore, dipendenti, anno di fondazione, paese, città, LinkedIn.
- Tecnologie usate: CMS, analytics, pagamenti, hosting.
- Traffico del sito: visite mensili stimate, ranking, frequenza di rimbalzo, fonti di traffico.
- SEO e backlink, registro del dominio (WHOIS), notizie recenti.

SU UNA PERSONA
- Profilo LinkedIn: titolo, ruolo, luogo, follower, scuola.
- Email di lavoro da un nome o dal profilo LinkedIn aperto, con verifica di consegna.
- Verifica un'email.

PRIMA IL PREZZO
Niente parte senza conferma. Una chiamata fallita costa 0 $. Limite per chiamata (0,10 $) e per sessione (1,00 $). Nessun abbonamento: la tua chiave looot e un saldo prepagato da 5 $. Catalogo gratuito di 4.200+ endpoint.

PRIVACY
Tre permessi e un solo host, api.looot.ai. Nessuno script nelle pagine, nessun contenuto letto. Niente analytics.

Codice sorgente (MIT): https://github.com/loootai/looot-chrome
```

### nl

```
Whozit, van looot, geeft info over websites en mensen in het zijpaneel van Chrome. Op elke pagina herkent het wat je bekijkt (bedrijfswebsite, teampagina, artikel, LinkedIn-profiel of -bedrijfspagina) en zet het de juiste opzoekingen bovenaan. De prijs staat er vóór elke oproep.

OP EEN BEDRIJFSWEBSITE
- Van wie is deze website: naam, sector, medewerkers, oprichtingsjaar, land, stad, LinkedIn.
- Techstack: CMS, analytics, betalingen, hosting.
- Websiteverkeer: geschatte bezoeken per maand, rang, bouncepercentage, verkeersbronnen.
- SEO en backlinks, domeinregistratie (WHOIS), recent nieuws.

OVER EEN PERSOON
- LinkedIn-profiel: kopregel, functie, locatie, volgers, opleiding.
- Zakelijk e-mailadres via een naam of het open LinkedIn-profiel, met controle op bezorgbaarheid.
- E-mail controleren.

EERST DE PRIJS
Niets draait zonder bevestiging. Een mislukte oproep kost $0. Limiet per oproep ($0,10) en per sessie ($1,00). Geen abonnement: je eigen looot-sleutel en prepaid saldo vanaf $5. Gratis catalogus met 4.200+ endpoints.

PRIVACY
Drie rechten en één host, api.looot.ai. Geen contentscripts, geen pagina-inhoud gelezen. Geen analytics.

Broncode (MIT): https://github.com/loootai/looot-chrome
```

### pt

```
Whozit, da looot, traz dados de sites e pessoas no painel lateral do Chrome. Em qualquer página ele reconhece o que você está vendo (site de empresa, página da equipe, artigo, perfil ou página de empresa no LinkedIn) e mostra primeiro as consultas certas. O preço aparece antes de cada consulta.

NUM SITE DE EMPRESA
- De quem é este site: nome, setor, funcionários, ano de fundação, país, cidade, LinkedIn.
- Tecnologias: CMS, analytics, pagamentos, hospedagem.
- Tráfego do site: visitas mensais estimadas, ranking, taxa de rejeição, fontes de tráfego.
- SEO e backlinks, registro do domínio (WHOIS), notícias recentes.

SOBRE UMA PESSOA
- Perfil do LinkedIn: título, cargo, local, seguidores, formação.
- E-mail de trabalho a partir de um nome ou do perfil do LinkedIn aberto, com verificação de entrega.
- Verificar um e-mail.

PRIMEIRO O PREÇO
Nada roda sem confirmação. Uma consulta com falha custa US$ 0. Limite por consulta (US$ 0,10) e por sessão (US$ 1,00). Sem assinatura: sua chave looot e saldo pré-pago a partir de US$ 5. Catálogo grátis com 4.200+ endpoints.

PRIVACIDADE
Três permissões e um só host, api.looot.ai. Sem scripts nas páginas, nenhum conteúdo lido. Sem analytics.

Código-fonte (MIT): https://github.com/loootai/looot-chrome
```

## Images

**Category**: Tools (under Productivity; Weespy and Similarweb list there). Second choice: Workflow & Planning.

**Store icon** (128x128): `public/icons/icon-128.png`. Full set in `public/icons/` (16, 32, 48, 128).

**Screenshots** (1280x800, English, upload in this order). Every image carries a "Demo data" label; the company is
made up and lives on a reserved `.example` domain. Prices on the images are the live listed prices at render time.

1. `store/screenshots/1-who-owns-this-website.png`
2. `store/screenshots/2-linkedin-profile-and-email.png`
3. `store/screenshots/3-website-traffic-checker.png`
4. `store/screenshots/4-tech-stack-and-news.png`
5. `store/screenshots/5-price-before-every-call.png`

**Localized screenshot** (first slot per language, then the English 2 to 5):
`store/screenshots/<fr|de|es|it|nl|pt>/1-company-lookup-<lang>.png`

**Small promo tile** (440x280): `store/promo-small-440x280.png`

**Marquee promo tile** (1400x560): `store/promo-marquee-1400x560.png`

**Video**: the store takes a YouTube link only. Upload `store/demo-video.mp4` (30 s, 1280x800, no sound) to
YouTube as unlisted or public, then paste the link. Script in `store/VIDEO-SCRIPT.md`.

**Additional fields**

| Field | Value |
| --- | --- |
| Official URL | looot.ai (pick it from the list; it shows once looot.ai is verified in Google Search Console with the same Google account) |
| Homepage URL | https://looot.ai |
| Support URL | https://looot.ai/contact |

## Privacy practices tab

**Single purpose**

```
Show business data about the page open in the current tab, from the side panel: for a website, the company behind it, its WHOIS record, tech stack, traffic estimate, SEO numbers and news; for a person (a LinkedIn profile or a team page), their public profile, work email and an email check. The price is shown before each paid lookup. Also searches the looot data API catalog.
```

**Permission justifications**

sidePanel

```
The whole interface is one side panel page. It opens when the user clicks the toolbar icon.
```

storage

```
chrome.storage.local keeps the user's own looot API key and two spending limits on this device. chrome.storage.session keeps the amount spent in this browser session and a 30 minute cache of nine public prices. Nothing is synced.
```

activeTab

```
When the user clicks the toolbar icon, the panel reads that tab's URL and title to tell what the page is (a company site, a team page, an article, a LinkedIn profile) and to get the domain or profile URL, so the user does not have to type it. No page content is read and no script is injected.
```

Host permission https://api.looot.ai/*

```
The panel calls the looot REST API from the extension page: free catalog search and prices, and, when the user confirms a lookup, the paid run with the user's key. This is the only host the extension contacts; the manifest's content security policy limits connections to it.
```

**Remote code**: No, I am not using remote code. All JavaScript is in the package; there is no eval and no script loaded from a server.

**Data usage** (tick these, leave the rest empty)

- Authentication information: the user's looot API key. Stored locally, sent only to api.looot.ai in the Authorization header.
- Personally identifiable information: the first and last name the user types for "Find a work email" (or the LinkedIn profile URL it starts from), and the email address returned. Sent to api.looot.ai only when the user confirms that lookup.
- Personally identifiable information also covers the LinkedIn profile URL and any email the user types to verify. Sent only when the user confirms that lookup.
- Web history: the URL and title of the current tab, read to choose the lookups. Only the domain or profile URL is sent to api.looot.ai, and only when the user confirms a lookup. No browsing history is collected in the background.

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
The Catalog tab works with no account. The lookups on the Lookup tab need a looot API key from https://looot.ai/settings. Without a key the Lookup tab shows a notice and the lookups stay disabled. Each lookup shows its price, waits for a Confirm click, then shows the result and the amount charged. A test key with a small balance can be provided on request: https://looot.ai/contact
```
