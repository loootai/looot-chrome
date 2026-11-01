# Chrome Web Store listing: looot-chrome 0.2.0

Paste each field into the developer dashboard. Name and summary come from `public/_locales/<lang>/messages.json`
(the manifest uses `__MSG_extName__` and `__MSG_extDescription__`), so the dashboard shows them per language
on its own. The detailed description, screenshots and promo tiles are entered per language.

Keyword basis: the title targets "company lookup" (1,000 US Google searches a month, store leader has 82 users)
and "who owns this website" (2,400, store leader 15 users), with "tech stack" and "traffic" in the tail. The
description reuses the words of the five closest listings (Similarweb, Hunter, Wappalyzer, BuiltWith, Who Owns
This Website?).

## Package

`store/looot-chrome-0.2.0.zip` (built by `npm run build && npm run pack`).

## Name and summary per language (from `_locales`)

| Lang | Name (75 max) | Summary (132 max) |
| --- | --- | --- |
| en | looot Company Lookup: Who Owns This Website, Tech Stack & Traffic | Company lookup for the site you're on: who owns it, tech stack, traffic, backlinks, WHOIS, work email. Price shown before each call. |
| fr | looot Recherche d'entreprise : à qui est ce site, technos et trafic | Infos entreprise du site ouvert : propriétaire, technos, trafic, backlinks, WHOIS, e-mails pro. Prix affiché avant chaque appel. |
| de | looot Firmensuche: Wem gehört diese Website? Tech-Stack & Traffic | Firmeninfos zur offenen Website: Inhaber, Tech-Stack, Traffic, Backlinks, WHOIS, Firmen-E-Mails. Preis vor jedem Abruf sichtbar. |
| es | looot Buscar empresa: de quién es esta web, tecnologías y tráfico | Empresa del sitio abierto: dueño, tecnologías, tráfico, backlinks, WHOIS, emails de trabajo. Precio antes de cada consulta. |
| it | looot Ricerca aziende: di chi è questo sito, tecnologie e traffico | Azienda del sito aperto: proprietario, tecnologie, traffico, backlink, WHOIS, email di lavoro. Prezzo prima di ogni chiamata. |
| nl | looot Bedrijf opzoeken: van wie is deze website, techstack, verkeer | Bedrijfsinfo van de open website: eigenaar, techstack, verkeer, backlinks, WHOIS, zakelijke e-mail. Prijs vóór elke oproep. |
| pt | looot Pesquisa de empresas: de quem é este site, tecnologia, tráfego | Empresa do site aberto: dono, tecnologias, tráfego, backlinks, WHOIS, e-mails de trabalho. Preço antes de cada consulta. |

## Detailed description

### en

```
Company lookup in Chrome's side panel. Open it on any website and see who owns the site, what it runs on, how much traffic it gets and who works there, with the price on screen before anything runs.

WHAT YOU CAN LOOK UP ON THE SITE YOU ARE ON
- Who owns this website: the company behind the domain. Name, industry, employee count, founding year, country, city, LinkedIn page and a short description.
- Domain record (WHOIS): registrar, creation date, expiry date, domain age and name servers. When the registrar hides the owner, the panel says so.
- Tech stack detector: the technologies the website uses, such as CMS, analytics, payments, hosting, chat and support tools.
- Website traffic checker: estimated monthly visits, global rank, country rank, category, bounce rate, pages per visit, time on site and traffic sources (organic search, direct, social, referrals, email, paid).
- SEO and backlinks: domain rank, backlink count, referring domains, spam score and first-seen date.
- Work email finder: type a first and last name, get the person's work address at this domain, then a deliverability check (valid, invalid, catch-all, risky).

FREE, NO ACCOUNT
The Catalog tab searches the looot catalog of 4,200+ data API endpoints from 300+ providers. Type a task such as "verify email" or "company news" and see each endpoint and what one call costs.

YOU SEE THE PRICE FIRST
- Every lookup shows its listed price and the most it can charge. Nothing runs until you click Confirm.
- After the run you see what was charged. A failed call costs $0.
- Set a cap per call (default $0.10) and a cap per browser session (default $1.00). The session total is always on screen.
- No subscription. You bring your own looot API key and pay per call from a prepaid balance. Top-ups start at $5 on looot.ai.

PRIVACY
- Three permissions: side panel, storage, active tab. One host: api.looot.ai.
- No content scripts. The extension does not read page content, cookies or your LinkedIn session.
- It reads the address of the tab you opened it on to get the domain, and sends that domain only when you confirm a lookup.
- Your key stays in this browser's local extension storage. It is not synced and is sent only to api.looot.ai.
- No analytics, no tracking.

GOOD TO KNOW
Traffic numbers are estimates from a traffic panel, not the site's own analytics. Company data comes from the provider looot routes the call to and can be missing for small or new companies. When a provider has nothing, the panel says so, and a failed call costs $0.

LANGUAGES
English, French, German, Spanish, Italian, Dutch and Portuguese.

Open source (MIT): https://github.com/loootai/looot-chrome
Docs: https://docs.looot.ai
```

### fr

```
Recherche d'entreprise dans le panneau latéral de Chrome. Ouvrez-le sur n'importe quel site : à qui appartient le site, ses technologies, son trafic, ses backlinks et les e-mails pro, avec le prix affiché avant chaque appel.

CE QUE VOUS POUVEZ CONSULTER
- À qui appartient ce site : l'entreprise derrière le domaine. Nom, secteur, effectif, année de création, pays, ville, page LinkedIn.
- Fiche du domaine (WHOIS) : registrar, dates de création et d'expiration, âge du domaine, serveurs DNS.
- Technologies utilisées : CMS, analytics, paiement, hébergement, outils de support.
- Trafic du site : visites mensuelles estimées, rang mondial et national, taux de rebond, sources de trafic.
- SEO et backlinks : rang du domaine, backlinks, domaines référents, score de spam.
- Trouver un e-mail pro : prénom et nom, puis l'adresse sur ce domaine et un test de délivrabilité.

GRATUIT, SANS COMPTE
L'onglet Catalogue cherche parmi 4 200+ endpoints de 300+ fournisseurs, avec le prix de chaque appel.

LE PRIX D'ABORD
Chaque recherche affiche son prix et le montant maximum. Rien ne part sans votre confirmation. Un appel en échec coûte 0 $. Plafond par appel (0,10 $ par défaut) et par session (1,00 $). Sans abonnement : votre propre clé looot et un solde prépayé, recharge dès 5 $.

CONFIDENTIALITÉ
Trois permissions (panneau latéral, stockage, onglet actif) et un seul hôte, api.looot.ai. Aucun script injecté, aucun contenu de page lu. Pas d'analytics, pas de suivi.

Les chiffres de trafic sont des estimations, pas les statistiques du site.

Code source (MIT) : https://github.com/loootai/looot-chrome
```

### de

```
Firmensuche im Seitenbereich von Chrome. Öffnen Sie das Panel auf einer beliebigen Website: wem die Website gehört, welcher Tech-Stack läuft, wie viel Traffic sie hat und wer dort arbeitet. Der Preis steht vor jedem Abruf da.

WAS SIE ABFRAGEN KÖNNEN
- Wem gehört diese Website: die Firma hinter der Domain. Name, Branche, Mitarbeiterzahl, Gründungsjahr, Land, Stadt, LinkedIn-Seite.
- Domain-Eintrag (WHOIS): Registrar, Erstellungs- und Ablaufdatum, Alter der Domain, Nameserver.
- Tech-Stack: CMS, Analytics, Zahlungen, Hosting, Support-Tools.
- Website-Traffic: geschätzte Besuche pro Monat, globaler und Länder-Rang, Absprungrate, Traffic-Quellen.
- SEO und Backlinks: Domain-Rang, Backlinks, verweisende Domains, Spam-Score.
- Firmen-E-Mail finden: Vor- und Nachname eingeben, Adresse bei dieser Domain erhalten, dann Zustellbarkeitsprüfung.

KOSTENLOS, OHNE KONTO
Der Katalog durchsucht 4.200+ Endpunkte von 300+ Anbietern, mit dem Preis pro Abruf.

ERST DER PREIS
Jede Abfrage zeigt ihren Preis und den Höchstbetrag. Nichts läuft ohne Ihre Bestätigung. Ein fehlgeschlagener Abruf kostet 0 $. Limit pro Abruf (Standard 0,10 $) und pro Sitzung (1,00 $). Kein Abo: eigener looot-Schlüssel und Prepaid-Guthaben, Aufladen ab 5 $.

DATENSCHUTZ
Drei Berechtigungen (Seitenbereich, Speicher, aktiver Tab) und ein Host, api.looot.ai. Keine Content-Skripte, kein Seiteninhalt wird gelesen. Keine Analytics, kein Tracking.

Traffic-Zahlen sind Schätzungen, nicht die Analytics der Website.

Quellcode (MIT): https://github.com/loootai/looot-chrome
```

### es

```
Búsqueda de empresas en el panel lateral de Chrome. Ábrelo en cualquier web: de quién es el sitio, qué tecnologías usa, cuánto tráfico tiene y quién trabaja allí, con el precio en pantalla antes de cada consulta.

QUÉ PUEDES CONSULTAR
- De quién es esta web: la empresa detrás del dominio. Nombre, sector, empleados, año de fundación, país, ciudad, LinkedIn.
- Registro del dominio (WHOIS): registrador, fechas de creación y vencimiento, antigüedad, servidores DNS.
- Tecnologías: CMS, analítica, pagos, alojamiento, herramientas de soporte.
- Tráfico web: visitas mensuales estimadas, ranking mundial y por país, tasa de rebote, fuentes de tráfico.
- SEO y backlinks: rango del dominio, backlinks, dominios de referencia, puntuación de spam.
- Email de trabajo: escribe nombre y apellido, obtén la dirección en este dominio y una verificación de entrega.

GRATIS, SIN CUENTA
El Catálogo busca entre 4.200+ endpoints de 300+ proveedores, con el precio de cada consulta.

PRIMERO EL PRECIO
Cada consulta muestra su precio y el máximo que puede cobrar. Nada se ejecuta sin tu confirmación. Una consulta fallida cuesta 0 $. Límite por consulta (0,10 $ por defecto) y por sesión (1,00 $). Sin suscripción: tu propia clave de looot y saldo prepago, recargas desde 5 $.

PRIVACIDAD
Tres permisos (panel lateral, almacenamiento, pestaña activa) y un solo host, api.looot.ai. Sin scripts en las páginas, no lee su contenido. Sin analítica ni rastreo.

Las cifras de tráfico son estimaciones, no la analítica del sitio.

Código abierto (MIT): https://github.com/loootai/looot-chrome
```

### it

```
Ricerca aziende nel pannello laterale di Chrome. Aprilo su qualsiasi sito: di chi è il sito, quali tecnologie usa, quanto traffico ha e chi ci lavora, con il prezzo a schermo prima di ogni chiamata.

COSA PUOI CERCARE
- Di chi è questo sito: l'azienda dietro il dominio. Nome, settore, dipendenti, anno di fondazione, paese, città, LinkedIn.
- Registro del dominio (WHOIS): registrar, date di creazione e scadenza, età del dominio, name server.
- Tecnologie usate: CMS, analytics, pagamenti, hosting, strumenti di supporto.
- Traffico del sito: visite mensili stimate, ranking globale e nazionale, frequenza di rimbalzo, fonti di traffico.
- SEO e backlink: rank del dominio, backlink, domini di riferimento, punteggio spam.
- Email di lavoro: scrivi nome e cognome, ottieni l'indirizzo su questo dominio e una verifica di consegna.

GRATIS, SENZA ACCOUNT
Il Catalogo cerca tra 4.200+ endpoint di 300+ fornitori, con il prezzo di ogni chiamata.

PRIMA IL PREZZO
Ogni ricerca mostra il prezzo e il massimo addebitabile. Niente parte senza la tua conferma. Una chiamata fallita costa 0 $. Limite per chiamata (0,10 $ predefinito) e per sessione (1,00 $). Nessun abbonamento: la tua chiave looot e un saldo prepagato, ricarica da 5 $.

PRIVACY
Tre permessi (pannello laterale, memoria, scheda attiva) e un solo host, api.looot.ai. Nessuno script nelle pagine, nessun contenuto letto. Niente analytics né tracciamento.

I dati di traffico sono stime, non le statistiche del sito.

Codice sorgente (MIT): https://github.com/loootai/looot-chrome
```

### nl

```
Bedrijf opzoeken in het zijpaneel van Chrome. Open het op elke website: van wie de site is, welke techstack hij draait, hoeveel verkeer hij krijgt en wie er werkt, met de prijs in beeld vóór elke oproep.

WAT JE KUNT OPZOEKEN
- Van wie is deze website: het bedrijf achter het domein. Naam, sector, medewerkers, oprichtingsjaar, land, stad, LinkedIn.
- Domeinregistratie (WHOIS): registrar, aanmaak- en vervaldatum, leeftijd van het domein, nameservers.
- Techstack: CMS, analytics, betalingen, hosting, supporttools.
- Websiteverkeer: geschatte bezoeken per maand, wereld- en landrang, bouncepercentage, verkeersbronnen.
- SEO en backlinks: domeinrang, backlinks, verwijzende domeinen, spamscore.
- Zakelijk e-mailadres: typ voor- en achternaam, krijg het adres op dit domein en een controle op bezorgbaarheid.

GRATIS, GEEN ACCOUNT
De Catalogus doorzoekt 4.200+ endpoints van 300+ aanbieders, met de prijs per oproep.

EERST DE PRIJS
Elke opzoeking toont de prijs en het maximum. Niets draait zonder je bevestiging. Een mislukte oproep kost $0. Limiet per oproep (standaard $0,10) en per sessie ($1,00). Geen abonnement: je eigen looot-sleutel en een prepaid saldo, opwaarderen vanaf $5.

PRIVACY
Drie rechten (zijpaneel, opslag, actief tabblad) en één host, api.looot.ai. Geen contentscripts, er wordt geen pagina-inhoud gelezen. Geen analytics, geen tracking.

Verkeerscijfers zijn schattingen, niet de eigen statistieken van de site.

Broncode (MIT): https://github.com/loootai/looot-chrome
```

### pt

```
Pesquisa de empresas no painel lateral do Chrome. Abra em qualquer site: de quem é o site, quais tecnologias usa, quanto tráfego recebe e quem trabalha lá, com o preço na tela antes de cada consulta.

O QUE VOCÊ PODE CONSULTAR
- De quem é este site: a empresa por trás do domínio. Nome, setor, funcionários, ano de fundação, país, cidade, LinkedIn.
- Registro do domínio (WHOIS): registrador, datas de criação e expiração, idade do domínio, servidores DNS.
- Tecnologias: CMS, analytics, pagamentos, hospedagem, ferramentas de suporte.
- Tráfego do site: visitas mensais estimadas, ranking global e por país, taxa de rejeição, fontes de tráfego.
- SEO e backlinks: rank do domínio, backlinks, domínios de referência, pontuação de spam.
- E-mail de trabalho: digite nome e sobrenome, receba o endereço neste domínio e uma verificação de entrega.

GRÁTIS, SEM CONTA
O Catálogo pesquisa 4.200+ endpoints de 300+ provedores, com o preço de cada consulta.

PRIMEIRO O PREÇO
Cada consulta mostra o preço e o máximo que pode cobrar. Nada roda sem a sua confirmação. Uma consulta com falha custa US$ 0. Limite por consulta (US$ 0,10 por padrão) e por sessão (US$ 1,00). Sem assinatura: sua própria chave looot e saldo pré-pago, recarga a partir de US$ 5.

PRIVACIDADE
Três permissões (painel lateral, armazenamento, aba ativa) e um só host, api.looot.ai. Sem scripts nas páginas, nenhum conteúdo de página é lido. Sem analytics, sem rastreamento.

Os números de tráfego são estimativas, não as estatísticas do próprio site.

Código-fonte (MIT): https://github.com/loootai/looot-chrome
```

## Images

**Category**: Tools (under Productivity; Weespy and Similarweb list there). Second choice: Workflow & Planning.

**Store icon** (128x128): `public/icons/icon-128.png`. Full set in `public/icons/` (16, 32, 48, 128).

**Screenshots** (1280x800, English, upload in this order). Every image carries a "Demo data" label; the company is
made up and lives on a reserved `.example` domain. Prices on the images are the live listed prices at render time.

1. `store/screenshots/1-who-owns-this-website.png`
2. `store/screenshots/2-website-traffic-checker.png`
3. `store/screenshots/3-tech-stack-detector.png`
4. `store/screenshots/4-price-before-every-call.png`
5. `store/screenshots/5-work-email-finder.png`

**Localized screenshot** (first slot per language, then the English 2 to 5):
`store/screenshots/<fr|de|es|it|nl|pt>/1-company-lookup-<lang>.png`

**Small promo tile** (440x280): `store/promo-small-440x280.png`

**Marquee promo tile** (1400x560): `store/promo-marquee-1400x560.png`

**Video**: the store takes a YouTube link only. Upload `store/demo-video.mp4` (21 s, 1280x800, no sound) to
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
Look up business data about the website open in the current tab (the company behind it, its WHOIS record, tech stack, traffic estimate, SEO numbers and a work email) and search the looot data API catalog, from the side panel, with the price shown before each paid lookup.
```

**Permission justifications**

sidePanel

```
The whole interface is one side panel page. It opens when the user clicks the toolbar icon.
```

storage

```
chrome.storage.local keeps the user's own looot API key and two spending limits on this device. chrome.storage.session keeps the amount spent in this browser session and a 30 minute cache of seven public prices. Nothing is synced.
```

activeTab

```
When the user clicks the toolbar icon, the panel reads that tab's URL to get the website's domain (for example example.com), so the user does not have to type it. No page content is read and no script is injected.
```

Host permission https://api.looot.ai/*

```
The panel calls the looot REST API from the extension page: free catalog search and prices, and, when the user confirms a lookup, the paid run with the user's key. This is the only host the extension contacts; the manifest's content security policy limits connections to it.
```

**Remote code**: No, I am not using remote code. All JavaScript is in the package; there is no eval and no script loaded from a server.

**Data usage** (tick these, leave the rest empty)

- Authentication information: the user's looot API key. Stored locally, sent only to api.looot.ai in the Authorization header.
- Personally identifiable information: the first and last name the user types for "Find a work email", and the email address returned. Sent to api.looot.ai only when the user confirms that lookup.
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
The Catalog tab works with no account. The six lookups on the Lookup tab need a looot API key from https://looot.ai/settings. Without a key the Lookup tab shows a notice and the lookups stay disabled. Each lookup shows its price, waits for a Confirm click, then shows the result and the amount charged. A test key with a small balance can be provided on request: https://looot.ai/contact
```
