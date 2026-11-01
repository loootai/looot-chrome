// The side panel. Free catalog search works without a token. Paid lookups show the price,
// wait for a confirm click, run under the caps and then show what was charged. Every visible
// string is a message key in public/_locales.

import { createClient, LoootError, type CatalogItem, type JobPrice, type Run } from "../lib/api";
import { ACTIONS, ALL_JOBS, JOB_COMPANY, JOB_EMAIL_FIND, JOB_EMAIL_VERIFY, JOB_SEO, JOB_TECH, JOB_TRAFFIC, JOB_WHOIS, newKey, type Action, type ActionId } from "../lib/actions";
import { domainFromInput, domainFromUrl } from "../lib/domain";
import { itemPrice, jobFrom, parseUsd, usd } from "../lib/format";
import { t, uiLang } from "../lib/i18n";
import { readCompany, readEmail, readSeo, readStatus, readTechnologies, readTraffic, readWhois, type Field } from "../lib/read";
import { runStep, type StepResult } from "../lib/runner";
import { EMPTY_SPEND, left, type Spend } from "../lib/spend";
import { DEFAULTS, loadSettings, loadSpend, saveLimits, saveSpend, saveToken, type Area, type Settings } from "../lib/store";
import { h, icon, ICONS, mount, type Child } from "./dom";

type Phase =
  | { kind: "idle" }
  | { kind: "confirm"; domain: string; keys: Record<string, string>; first?: string; last?: string }
  | { kind: "running"; label: string }
  | { kind: "done"; domain: string; steps: StepResult[]; fields: Field[]; chips: string[]; headline: string; note: string }
  | { kind: "error"; message: string; topUpUrl?: string; retry?: Phase };

const local: Area = chrome.storage.local;
const session: Area = chrome.storage.session;

const state = {
  settings: { ...DEFAULTS } as Settings,
  spend: { ...EMPTY_SPEND } as Spend,
  prices: null as Record<string, JobPrice> | null,
  pricesError: false,
  tabDomain: null as string | null,
  manualDomain: null as string | null,
  editingDomain: false,
  balance: null as number | null,
  phases: Object.fromEntries(ACTIONS.map((a) => [a.id, { kind: "idle" }])) as Record<ActionId, Phase>,
  person: { first: "", last: "" },
  catalog: { q: "", status: "idle" as "idle" | "loading" | "done" | "error", items: [] as CatalogItem[], seq: 0 },
  settingsNote: "" as string,
};

const client = createClient({ getToken: async () => state.settings.token });

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const domain = () => state.manualDomain ?? state.tabDomain;
const ACTION_ICONS: Record<ActionId, string> = { company: ICONS.building, whois: ICONS.id, tech: ICONS.layers, traffic: ICONS.chart, seo: ICONS.link, email: ICONS.mail };
const LOCALE = uiLang();

// ---------- site bar ----------

function renderSite(): void {
  const d = domain();
  if (state.editingDomain || !d) {
    const input = h("input", {
      id: "domain-input", type: "text", inputmode: "url", autocomplete: "off", spellcheck: "false",
      placeholder: t("domainPlaceholder"), value: d ?? "", "aria-describedby": "domain-help",
    });
    const error = h("p", { class: "field-error", role: "alert", hidden: true }, t("domainError"));
    const submit = (e: Event) => {
      e.preventDefault();
      const next = domainFromInput(input.value);
      if (!next) {
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
        return;
      }
      state.manualDomain = next;
      state.editingDomain = false;
      resetPhases();
      renderSite();
      renderLookup();
    };
    mount(
      $("site"),
      h("form", { class: "site-form", onsubmit: submit },
        h("label", { for: "domain-input" }, t("domainLabel")),
        h("div", { class: "row" }, input, h("button", { class: "btn", type: "submit" }, t("domainUse"))),
        error,
        h("p", { id: "domain-help", class: "help" },
          d ? t("domainOverride") : t("domainNone")),
      ),
    );
    if (state.editingDomain) input.focus();
    return;
  }
  mount(
    $("site"),
    h("div", { class: "site-chip" },
      h("span", { class: "site-icon" }, icon(ICONS.globe)),
      h("div", { class: "site-text" },
        h("span", { class: "eyebrow" }, state.manualDomain ? t("siteTyped") : t("siteTab")),
        h("span", { class: "domain", title: d }, d),
      ),
      h("button", {
        class: "btn ghost small", type: "button", "aria-label": t("domainChangeLabel"),
        onclick: () => { state.editingDomain = true; renderSite(); },
      }, icon(ICONS.edit), t("domainChange")),
    ),
  );
}

async function readTab(): Promise<void> {
  let next: string | null = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    next = domainFromUrl(tab?.url);
  } catch {
    next = null;
  }
  if (next === state.tabDomain) return;
  const changed = next !== domain();
  state.tabDomain = next;
  state.manualDomain = null;
  state.editingDomain = false;
  if (changed) resetPhases();
  renderSite();
  renderLookup();
}

function resetPhases(): void {
  for (const a of ACTIONS) if (state.phases[a.id].kind !== "running") state.phases[a.id] = { kind: "idle" };
}

// ---------- lookup ----------

function renderLookup(): void {
  const view = $("view-lookup");
  const children: Child[] = [];
  if (!state.settings.token) {
    children.push(
      h("div", { class: "notice" },
        h("span", { class: "notice-icon" }, icon(ICONS.lock)),
        h("div", {},
          h("p", { class: "notice-title" }, t("needTokenTitle")),
          h("p", { class: "help" }, t("needTokenBody")),
          h("div", { class: "row" },
            h("button", { class: "btn", type: "button", onclick: () => selectTab("settings") }, t("addToken")),
            h("a", { class: "btn ghost", href: "https://looot.ai/settings", target: "_blank", rel: "noopener" }, t("getToken")),
          ),
        ),
      ),
    );
  }
  if (state.pricesError) {
    children.push(
      h("div", { class: "notice warn", role: "alert" },
        h("span", { class: "notice-icon" }, icon(ICONS.alert)),
        h("div", {},
          h("p", { class: "notice-title" }, t("pricesFailedTitle")),
          h("p", { class: "help" }, t("pricesFailedBody")),
          h("button", { class: "btn ghost", type: "button", onclick: () => void loadPrices(true) }, t("tryAgain")),
        ),
      ),
    );
  }
  children.push(h("ul", { class: "actions" }, ...ACTIONS.map(renderAction)));
  mount(view, ...children);
}

function priceLine(job: string): Child {
  if (!state.prices) return h("span", { class: state.pricesError ? "price muted" : "price skeleton" }, state.pricesError ? t("priceUnavailable") : t("fromPerCall", "$0.0000"));
  return h("span", { class: "price" }, jobFrom(state.prices[job]));
}

function renderAction(action: Action): HTMLElement {
  const phase = state.phases[action.id];
  const d = domain();
  const listed = state.prices?.[action.jobs[0]!]?.cheapestPerCall ?? null;
  const overCap = listed !== null && listed > state.settings.maxPerCall;
  const ready = Boolean(state.settings.token && state.prices && d && !overCap);
  const head = h("div", { class: "action-head" },
    h("span", { class: "action-icon" }, icon(ACTION_ICONS[action.id])),
    h("div", { class: "action-text" },
      h("h2", {}, t(`${action.key}Title`)),
      h("p", { class: "help" }, t(`${action.key}Hint`)),
      h("p", { class: "price-row" }, priceLine(action.jobs[0]!)),
    ),
  );
  const body: Child[] = [];

  if (phase.kind === "idle") {
    if (action.id === "email") {
      const first = h("input", { id: "first-name", type: "text", autocomplete: "off", value: state.person.first, oninput: (e: Event) => { state.person.first = (e.target as HTMLInputElement).value; } });
      const last = h("input", { id: "last-name", type: "text", autocomplete: "off", value: state.person.last, oninput: (e: Event) => { state.person.last = (e.target as HTMLInputElement).value; } });
      const error = h("p", { class: "field-error", role: "alert", hidden: true }, t("nameError"));
      body.push(
        h("form", {
          class: "stack",
          onsubmit: (e: Event) => {
            e.preventDefault();
            const f = state.person.first.trim();
            const l = state.person.last.trim();
            if (!f || !l) { error.hidden = false; return; }
            startConfirm(action, { first: f, last: l });
          },
        },
          h("div", { class: "grid2" },
            h("div", { class: "field" }, h("label", { for: "first-name" }, t("firstName")), first),
            h("div", { class: "field" }, h("label", { for: "last-name" }, t("lastName")), last),
          ),
          error,
          h("button", { class: "btn", type: "submit", disabled: !ready }, t("seePrice")),
        ),
      );
    } else {
      body.push(h("button", { class: "btn", type: "button", disabled: !ready, onclick: () => startConfirm(action, {}) }, t("seePrice")));
    }
    if (!d) body.push(h("p", { class: "help" }, t("needsDomain")));
    if (overCap) {
      body.push(h("p", { class: "help warn-text" }, t("overCap", usd(listed), usd(state.settings.maxPerCall)), " ",
        h("button", { class: "linkish", type: "button", onclick: () => selectTab("settings") }, t("openSettings"))));
    }
  }

  if (phase.kind === "confirm") {
    const cap = state.settings.maxPerCall;
    const jobs = action.jobs;
    const most = cap * jobs.length;
    body.push(
      h("div", { class: "confirm", role: "group", "aria-label": t("confirmLabel", t(`${action.key}Title`)) },
        h("p", { class: "confirm-target" },
          action.id === "email" ? t("confirmPerson", `${phase.first} ${phase.last}`) : t("confirmOn"),
          " ", h("span", { class: "domain" }, phase.domain),
        ),
        h("ul", { class: "steps" },
          ...jobs.map((job, i) =>
            h("li", {},
              h("span", { class: "mono job" }, `job:${job}`),
              h("span", { class: "price" }, jobFrom(state.prices?.[job])),
              i > 0 ? h("span", { class: "help" }, t("verifyOnlyIfFound")) : null,
            ),
          ),
        ),
        h("p", { class: "cap-line" },
          t("mostCharge"), " ", h("strong", { class: "mono" }, usd(most)), " ",
          jobs.length > 1 ? t("capEachCall", usd(cap)) : t("capYourCall"),
          " ", t("failedFree"),
        ),
        h("div", { class: "row" },
          h("button", { class: "btn primary", type: "button", onclick: () => void runAction(action, phase) }, t("confirmRun")),
          h("button", { class: "btn ghost", type: "button", onclick: () => setPhase(action.id, { kind: "idle" }) }, t("cancel")),
        ),
      ),
    );
  }

  if (phase.kind === "running") {
    body.push(
      h("div", { class: "running", role: "status" },
        h("span", { class: "spinner", "aria-hidden": "true" }),
        h("span", {}, phase.label),
      ),
      h("div", { class: "skeleton-block", "aria-hidden": "true" }, h("span", {}), h("span", {}), h("span", {})),
    );
  }

  if (phase.kind === "done") {
    const total = phase.steps.reduce((sum, s) => sum + s.counted, 0);
    const raw = JSON.stringify(phase.steps.map((s) => ({ runId: s.run.runId, status: s.run.status, actualCost: s.run.actualCost, result: s.run.result })), null, 2);
    const copy = h("button", { class: "btn ghost small", type: "button", onclick: () => void copyText(raw, copy) }, icon(ICONS.copy), t("copyJson"));
    body.push(
      h("div", { class: "result" },
        phase.headline ? h("p", { class: "headline" }, phase.headline) : null,
        phase.note ? h("p", { class: "help" }, phase.note) : null,
        phase.fields.length > 0
          ? h("dl", { class: "fields" }, ...phase.fields.flatMap((f) => [h("dt", {}, t(f.label)), h("dd", { title: f.value }, f.value)]))
          : null,
        phase.chips.length > 0 ? h("ul", { class: "chips" }, ...phase.chips.map((c) => h("li", {}, c))) : null,
        h("div", { class: "receipt" },
          h("span", { class: "receipt-label" }, t("charged")),
          h("strong", { class: "mono" }, usd(total)),
          h("span", { class: "help" }, phase.steps.map((s) => s.run.route?.servedBy).filter(Boolean).join(", ")),
        ),
        ...phase.steps.filter((s) => !s.settled).map(() =>
          h("p", { class: "help" }, t("notSettled")),
        ),
        h("details", {}, h("summary", {}, t("rawAnswer")), h("pre", {}, raw.length > 6000 ? raw.slice(0, 6000) + "\n..." : raw)),
        h("div", { class: "row" },
          copy,
          h("button", { class: "btn ghost small", type: "button", onclick: () => setPhase(action.id, { kind: "idle" }) }, t("runAnother")),
        ),
      ),
    );
  }

  if (phase.kind === "error") {
    body.push(
      h("div", { class: "notice warn", role: "alert" },
        h("span", { class: "notice-icon" }, icon(ICONS.alert)),
        h("div", {},
          h("p", { class: "notice-title" }, t("nothingRan")),
          h("p", { class: "help" }, phase.message),
          h("div", { class: "row" },
            phase.retry ? h("button", { class: "btn", type: "button", onclick: () => setPhase(action.id, phase.retry!) }, t("back")) : null,
            phase.topUpUrl ? h("a", { class: "btn ghost", href: phase.topUpUrl, target: "_blank", rel: "noopener" }, t("topUp")) : null,
            h("button", { class: "btn ghost", type: "button", onclick: () => setPhase(action.id, { kind: "idle" }) }, t("dismiss")),
          ),
        ),
      ),
    );
  }

  return h("li", { class: `action is-${phase.kind}`, id: `action-${action.id}` }, head, ...body);
}

function setPhase(id: ActionId, phase: Phase): void {
  state.phases[id] = phase;
  renderLookup();
}

function startConfirm(action: Action, person: { first?: string; last?: string }): void {
  const d = domain();
  if (!d) return;
  // One key per step, made when the price is shown, so a double click cannot pay twice.
  const keys: Record<string, string> = {};
  for (const job of action.jobs) keys[job] = newKey(job);
  setPhase(action.id, { kind: "confirm", domain: d, keys, ...person });
}

function safeUrl(u: string | undefined): string | undefined {
  return u && /^https:\/\/([a-z0-9-]+\.)*looot\.ai(\/|$)/.test(u) ? u : undefined;
}

function describeFailure(run: Run): string {
  return run.error?.message ?? t("runEnded", run.status);
}

async function runAction(action: Action, phase: Extract<Phase, { kind: "confirm" }>): Promise<void> {
  const deps = {
    client,
    limits: () => ({ maxPerCall: state.settings.maxPerCall, sessionCap: state.settings.sessionCap }),
    getSpend: () => state.spend,
    setSpend: async (s: Spend) => { state.spend = s; renderMeter(); await saveSpend(session, s); },
  };
  const steps: StepResult[] = [];
  const done = (fields: Field[], chips: string[], headline: string, note: string) =>
    setPhase(action.id, { kind: "done", domain: phase.domain, steps, fields, chips, headline, note });
  const one = async (job: string, label: string) => {
    setPhase(action.id, { kind: "running", label });
    const step = await runStep(deps, job, { domain: phase.domain }, phase.keys[job]!);
    steps.push(step);
    return step.run.status === "completed" ? step.run : null;
  };
  const failed = () => describeFailure(steps[steps.length - 1]!.run);
  try {
    if (action.id === "company") {
      const run = await one(JOB_COMPANY, t("runningCompany", phase.domain));
      const fields = run ? readCompany(run) : [];
      const name = fields.find((f) => f.label === "fieldName")?.value ?? "";
      done(fields.filter((f) => f.label !== "fieldName"), [], name, !run ? failed() : fields.length === 0 ? t("emptyCompany") : "");
    } else if (action.id === "whois") {
      const run = await one(JOB_WHOIS, t("runningWhois", phase.domain));
      const card = run ? readWhois(run) : { fields: [], chips: [], redacted: false };
      done(card.fields, card.chips, "", !run ? failed() : card.fields.length === 0 ? t("emptyAnswer") : card.redacted ? t("whoisRedacted") : "");
    } else if (action.id === "tech") {
      const run = await one(JOB_TECH, t("runningTech", phase.domain));
      const names = run ? readTechnologies(run) : [];
      done([], names, names.length > 0 ? t("techCount", names.length) : "", !run ? failed() : names.length === 0 ? t("emptyTech") : "");
    } else if (action.id === "traffic") {
      const run = await one(JOB_TRAFFIC, t("runningTraffic", phase.domain));
      const card = run ? readTraffic(run, LOCALE) : { fields: [], chips: [] };
      done(card.fields, card.chips, "", !run ? failed() : card.fields.length === 0 ? t("emptyAnswer") : t("trafficNote"));
    } else if (action.id === "seo") {
      const run = await one(JOB_SEO, t("runningSeo", phase.domain));
      const card = run ? readSeo(run, LOCALE) : { fields: [], chips: [] };
      done(card.fields, [], "", !run ? failed() : card.fields.length === 0 ? t("emptyAnswer") : "");
    } else {
      setPhase(action.id, { kind: "running", label: t("runningEmail") });
      const find = await runStep(deps, JOB_EMAIL_FIND, { first_name: phase.first ?? "", last_name: phase.last ?? "", domain: phase.domain }, phase.keys[JOB_EMAIL_FIND]!);
      steps.push(find);
      const email = find.run.status === "completed" ? readEmail(find.run) : "";
      if (!email) {
        done([], [], "", find.run.status !== "completed" ? describeFailure(find.run) : t("emptyEmail"));
        return;
      }
      setPhase(action.id, { kind: "running", label: t("runningVerify", email) });
      let status = "";
      let note = "";
      try {
        const verify = await runStep(deps, JOB_EMAIL_VERIFY, { email }, phase.keys[JOB_EMAIL_VERIFY]!);
        steps.push(verify);
        status = verify.run.status === "completed" ? readStatus(verify.run) : "";
        if (verify.run.status !== "completed") note = t("verifyUnfinished", describeFailure(verify.run));
      } catch (err) {
        note = t("verifyNotRun", err instanceof Error ? err.message : "unknown error");
      }
      const fields: Field[] = status ? [{ label: "fieldCheck", value: t(`status_${status.replace("-", "")}`) }] : [];
      done(fields, [], email, note);
    }
  } catch (err) {
    const e = err instanceof LoootError ? err : new LoootError(0, "unknown", t("errUnknown"));
    const { maxPerCall, sessionCap } = state.settings;
    const message =
      e.code === "session_cap" ? t("errSessionCap", usd(maxPerCall), usd(left(state.spend, sessionCap)), usd(sessionCap))
      : e.code === "network" ? t("errNetwork")
      : e.code === "missing_token" ? t("errMissingToken")
      : e.status === 401 ? t("errToken")
      : e.status === 402 || e.code.includes("insufficient") ? `${e.message} ${t("errTopUp")}`
      : e.message;
    if (steps.length > 0) {
      done([], [], "", message);
    } else {
      // The same keys are kept, so going back and confirming again cannot create a second charge.
      setPhase(action.id, { kind: "error", message, topUpUrl: safeUrl(e.topUpUrl), retry: e.code === "session_cap" ? undefined : phase });
    }
  } finally {
    void loadBalance();
  }
}

async function copyText(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("copied");
    setTimeout(() => button.classList.remove("copied"), 1200);
  } catch {
    // Clipboard blocked: the raw answer is still on screen to select by hand.
  }
}

// ---------- catalog ----------

const SUGGESTIONS = ["suggest1", "suggest2", "suggest3", "suggest4", "suggest5", "suggest6"];

function renderCatalog(): void {
  const view = $("view-catalog");
  const input = h("input", {
    id: "catalog-q", type: "search", placeholder: t("catalogPlaceholder"), autocomplete: "off",
    value: state.catalog.q, "aria-label": t("catalogLabel"),
    oninput: (e: Event) => queueSearch((e.target as HTMLInputElement).value),
  });
  mount(
    view,
    h("div", { class: "search" }, h("span", { class: "search-icon" }, icon(ICONS.search)), input),
    h("p", { class: "help" }, t("catalogHelp")),
    h("div", { id: "catalog-results", "aria-live": "polite" }),
  );
  renderCatalogResults();
}

function renderCatalogResults(): void {
  const box = document.getElementById("catalog-results");
  if (!box) return;
  const c = state.catalog;
  if (c.status === "idle") {
    mount(box,
      h("div", { class: "empty" },
        h("p", { class: "empty-title" }, t("catalogEmptyTitle")),
        h("p", { class: "help" }, t("catalogEmptyBody")),
        h("ul", { class: "chips click" }, ...SUGGESTIONS.map((key) => {
          const s = t(key);
          return h("li", {}, h("button", { type: "button", onclick: () => { state.catalog.q = s; renderCatalog(); void search(s); } }, s));
        })),
      ),
    );
  } else if (c.status === "loading") {
    mount(box, h("ul", { class: "results", "aria-busy": "true" }, ...[0, 1, 2, 3].map(() =>
      h("li", { class: "result-row skeleton-row", "aria-hidden": "true" }, h("span", {}), h("span", {}), h("span", {})))));
  } else if (c.status === "error") {
    mount(box,
      h("div", { class: "notice warn", role: "alert" },
        h("span", { class: "notice-icon" }, icon(ICONS.alert)),
        h("div", {},
          h("p", { class: "notice-title" }, t("searchFailedTitle")),
          h("p", { class: "help" }, t("errNetwork")),
          h("button", { class: "btn ghost", type: "button", onclick: () => void search(c.q) }, t("tryAgain")),
        ),
      ),
    );
  } else if (c.items.length === 0) {
    mount(box,
      h("div", { class: "empty" },
        h("p", { class: "empty-title" }, t("noMatchTitle", c.q)),
        h("p", { class: "help" }, t("noMatchBody")),
      ),
    );
  } else {
    mount(box, h("ul", { class: "results" }, ...c.items.map(renderItem)));
  }
}

/** Catalog descriptions carry light markdown. Shown as text, so the markers are dropped. */
function plain(text: string): string {
  return text.replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();
}

function renderItem(item: CatalogItem): HTMLElement {
  const slash = item.title.indexOf(" / ");
  const provider = slash > 0 ? item.title.slice(0, slash) : item.providerId;
  const title = slash > 0 ? item.title.slice(slash + 3) : item.title;
  const copy = h("button", { class: "btn ghost small", type: "button", title: t("copyIdTitle"), onclick: () => void copyText(item.operationId, copy) }, icon(ICONS.copy), t("copyId"));
  return h("li", { class: "result-row" },
    h("div", { class: "result-top" },
      h("span", { class: "eyebrow" }, provider),
      h("span", { class: "price" }, itemPrice(item.price)),
    ),
    h("h3", {}, title),
    item.description ? h("p", { class: "help clamp" }, plain(item.description)) : null,
    h("div", { class: "result-foot" }, h("code", { class: "mono id", title: item.operationId }, item.operationId), copy),
  );
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

function queueSearch(q: string): void {
  state.catalog.q = q;
  clearTimeout(searchTimer);
  if (!q.trim()) {
    state.catalog.status = "idle";
    state.catalog.seq++;
    renderCatalogResults();
    return;
  }
  searchTimer = setTimeout(() => void search(q), 300);
}

async function search(q: string): Promise<void> {
  const text = q.trim().slice(0, 200);
  if (!text) return;
  const seq = ++state.catalog.seq;
  state.catalog.status = "loading";
  renderCatalogResults();
  try {
    const items = await client.searchCatalog(text, 20);
    if (seq !== state.catalog.seq) return;
    state.catalog.items = items;
    state.catalog.status = "done";
  } catch {
    if (seq !== state.catalog.seq) return;
    state.catalog.status = "error";
  }
  renderCatalogResults();
}

// ---------- settings ----------

function renderSettings(): void {
  const view = $("view-settings");
  const hasToken = Boolean(state.settings.token);
  const token = h("input", { id: "token", type: "password", autocomplete: "off", spellcheck: "false", placeholder: hasToken ? t("tokenSavedPlaceholder") : "cs_ms_..." });
  const tokenNote = h("p", { class: "help", role: "status" }, state.settingsNote);
  const perCall = h("input", { id: "max-per-call", type: "text", inputmode: "decimal", value: String(state.settings.maxPerCall) });
  const cap = h("input", { id: "session-cap", type: "text", inputmode: "decimal", value: String(state.settings.sessionCap) });
  const limitsError = h("p", { class: "field-error", role: "alert", hidden: true }, t("limitsError"));
  const limitsNote = h("p", { class: "help", role: "status" });

  mount(
    view,
    h("form", {
      class: "stack card",
      onsubmit: (e: Event) => {
        e.preventDefault();
        const value = token.value.trim();
        if (!value) return;
        void (async () => {
          await saveToken(local, value);
          state.settings.token = value;
          state.settingsNote = t("tokenSaved");
          try {
            const b = await client.balance();
            state.balance = typeof b?.available === "number" ? b.available : null;
          } catch (err) {
            state.balance = null;
            if (err instanceof LoootError && err.status === 401) state.settingsNote = t("tokenRejected");
          }
          renderAll();
        })();
      },
    },
      h("h2", {}, t("tokenTitle")),
      h("div", { class: "field" },
        h("label", { for: "token" }, t("tokenLabel")),
        token,
        h("p", { class: "help" }, t("tokenHelp")),
      ),
      tokenNote,
      h("div", { class: "row" },
        h("button", { class: "btn primary", type: "submit" }, hasToken ? t("tokenReplace") : t("tokenSave")),
        hasToken ? h("button", {
          class: "btn ghost", type: "button",
          onclick: () => void (async () => {
            await saveToken(local, "");
            state.settings.token = "";
            state.balance = null;
            state.settingsNote = t("tokenRemoved");
            renderAll();
          })(),
        }, t("tokenRemove")) : null,
      ),
      h("p", { class: "help" },
        t("tokenHowBefore"), " ",
        h("a", { href: "https://looot.ai/settings", target: "_blank", rel: "noopener" }, t("tokenHowLink")),
        " ", t("tokenHowAfter"),
      ),
    ),
    h("form", {
      class: "stack card",
      onsubmit: (e: Event) => {
        e.preventDefault();
        const a = parseUsd(perCall.value);
        const b = parseUsd(cap.value);
        if (a === null || b === null || b < a) { limitsError.hidden = false; return; }
        limitsError.hidden = true;
        state.settings.maxPerCall = a;
        state.settings.sessionCap = b;
        void saveLimits(local, a, b).then(() => { limitsNote.textContent = t("limitsSaved"); renderMeter(); renderLookup(); });
      },
    },
      h("h2", {}, t("limitsTitle")),
      h("div", { class: "grid2" },
        h("div", { class: "field" }, h("label", { for: "max-per-call" }, t("capPerCall")), perCall),
        h("div", { class: "field" }, h("label", { for: "session-cap" }, t("capSession")), cap),
      ),
      limitsError,
      h("p", { class: "help" }, t("limitsHelp")),
      limitsNote,
      h("div", { class: "row" },
        h("button", { class: "btn", type: "submit" }, t("limitsSave")),
        h("button", {
          class: "btn ghost", type: "button",
          onclick: () => { state.spend = { ...EMPTY_SPEND }; void saveSpend(session, state.spend); renderMeter(); limitsNote.textContent = t("counterReset"); },
        }, t("counterResetButton")),
      ),
    ),
    h("div", { class: "card links" },
      h("h2", {}, t("aboutTitle")),
      h("p", { class: "help" }, t("aboutBody")),
      h("p", { class: "link-row" },
        h("a", { href: "https://looot.ai", target: "_blank", rel: "noopener" }, "looot.ai"),
        h("a", { href: "https://docs.looot.ai", target: "_blank", rel: "noopener" }, t("linkDocs")),
        h("a", { href: "https://looot.ai/privacy", target: "_blank", rel: "noopener" }, t("linkPrivacy")),
        h("a", { href: "https://looot.ai/contact", target: "_blank", rel: "noopener" }, t("linkSupport")),
        h("a", { href: "https://github.com/loootai/looot-chrome", target: "_blank", rel: "noopener" }, t("linkSource")),
      ),
    ),
  );
}

// ---------- meter, balance, tabs ----------

function renderMeter(): void {
  const { spend, settings } = state;
  const used = spend.spent + spend.reserved;
  const pct = Math.min(100, Math.round((used / settings.sessionCap) * 100));
  mount(
    $("meter"),
    h("div", { class: "meter-row" },
      h("span", {}, t("meterSession"), " ", h("strong", { class: "mono" }, usd(spend.spent)), " ", t("meterOf", usd(settings.sessionCap))),
      h("span", { class: "help" }, spend.reserved > 0 ? t("meterHeld", usd(spend.reserved)) : t(spend.runs === 1 ? "meterLeftOne" : "meterLeft", usd(left(spend, settings.sessionCap)), spend.runs)),
    ),
    h("div", { class: `bar${pct >= 90 ? " full" : ""}`, role: "progressbar", "aria-label": t("meterLabel"), "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct },
      h("span", { style: `transform: scaleX(${pct / 100})` })),
  );
}

function renderBalance(): void {
  const el = $("balance");
  if (state.balance === null || !state.settings.token) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  mount(el, h("span", { class: "eyebrow" }, t("balance")), h("strong", { class: "mono" }, usd(Math.round(state.balance * 100) / 100)));
}

async function loadBalance(): Promise<void> {
  if (!state.settings.token) return;
  try {
    const b = await client.balance();
    state.balance = typeof b?.available === "number" ? b.available : null;
  } catch {
    state.balance = null;
  }
  renderBalance();
}

async function loadPrices(force = false): Promise<void> {
  state.pricesError = false;
  if (force) { state.prices = null; renderLookup(); }
  try {
    const cached = (await session.get(["prices"])).prices as { at: number; jobs: Record<string, JobPrice> } | undefined;
    if (!force && cached && Date.now() - cached.at < 30 * 60_000) {
      state.prices = cached.jobs;
    } else {
      state.prices = await client.jobPrices(ALL_JOBS);
      await session.set({ prices: { at: Date.now(), jobs: state.prices } });
    }
  } catch {
    state.prices = null;
    state.pricesError = true;
  }
  renderLookup();
}

function selectTab(name: string): void {
  for (const tab of document.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
    const on = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    $(`view-${tab.dataset.tab}`).hidden = !on;
  }
  if (name === "settings") { state.settingsNote = ""; renderSettings(); }
}

/** Static strings in sidepanel.html carry a data-i18n attribute with their message key. */
function translateStatic(): void {
  document.documentElement.lang = LOCALE ?? "en";
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) el.textContent = t(el.dataset.i18n ?? "");
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n-label]")) el.setAttribute("aria-label", t(el.dataset.i18nLabel ?? ""));
}

function renderAll(): void {
  renderSite();
  renderLookup();
  renderSettings();
  renderMeter();
  renderBalance();
}

async function init(): Promise<void> {
  translateStatic();
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab ?? "lookup"));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
      next.focus();
      selectTab(next.dataset.tab ?? "lookup");
    });
  });
  state.settings = await loadSettings(local);
  state.spend = await loadSpend(session);
  renderAll();
  renderCatalog();
  await readTab();
  chrome.tabs.onActivated.addListener(() => void readTab());
  chrome.tabs.onUpdated.addListener((_id, info) => { if (info.url || info.status === "complete") void readTab(); });
  chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === "looot:tab-granted") void readTab(); });
  void loadPrices();
  void loadBalance();
}

void init();
