// UI strings. Text lives in public/_locales/<lang>/messages.json and Chrome picks the browser's
// language, falling back to English. A missing key shows the key itself, which tests catch.

export type Getter = (key: string, subs?: string[]) => string;

let getter: Getter = (key, subs) => {
  try {
    return chrome.i18n.getMessage(key, subs);
  } catch {
    return "";
  }
};

/** Replaces the message source. Tests and the store screenshot script use it. */
export function setGetter(next: Getter): void {
  getter = next;
}

/** The message for `key` with $1, $2 filled from `subs`. */
export function t(key: string, ...subs: (string | number)[]): string {
  const s = subs.map(String);
  return getter(key, s.length > 0 ? s : undefined) || key;
}

/** Builds a getter from a parsed messages.json, the same way Chrome fills placeholders. */
export function getterFrom(messages: Record<string, { message: string; placeholders?: Record<string, { content: string }> }>): Getter {
  return (key, subs = []) => {
    const m = messages[key];
    if (!m) return "";
    let text = m.message;
    for (const [name, p] of Object.entries(m.placeholders ?? {})) {
      text = text.replace(new RegExp(`\\$${name}\\$`, "gi"), p.content);
    }
    return text.replace(/\$\$|\$(\d)/g, (all, n?: string) => (n ? subs[Number(n) - 1] ?? "" : "$"));
  };
}

/** The browser UI language, for number formats. Undefined outside an extension page. */
export function uiLang(): string | undefined {
  try {
    return chrome.i18n.getUILanguage();
  } catch {
    return undefined;
  }
}
