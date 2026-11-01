// Small DOM builder. Text from the API is always set as text, never parsed as HTML.

export type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === "class") {
      el.className = String(v);
    } else if (k === "value" && "value" in el) {
      (el as HTMLInputElement).value = String(v);
    } else {
      el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export function mount(target: Element, ...children: Child[]): void {
  target.replaceChildren(...(children.filter((c) => c !== null && c !== undefined && c !== false) as (Node | string)[]));
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** A 16px stroke icon from a path string. */
export function icon(d: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}

export const ICONS = {
  search: "M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM14.5 14.5 11 11",
  globe: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM1.5 8h13M8 1.5c2 2.2 2 10.8 0 13M8 1.5c-2 2.2-2 10.8 0 13",
  building: "M3 14.5v-12h7v12M10 6.5h3v8M1.5 14.5h13M5.5 5.5h2M5.5 8.5h2M5.5 11.5h2",
  mail: "M1.5 4h13v8.5h-13zM1.5 4.5 8 9l6.5-4.5",
  layers: "M8 1.5 1.5 5 8 8.5 14.5 5 8 1.5ZM1.5 8 8 11.5 14.5 8M1.5 11 8 14.5 14.5 11",
  check: "M3 8.5 6.5 12 13 4.5",
  copy: "M6 6h7.5v7.5H6zM10 3.5V2.5H2.5V10h1",
  alert: "M8 5.5v3.5M8 11.5v.01M8 1.5l6.5 12h-13L8 1.5Z",
  lock: "M4 7.5h8v6H4zM5.5 7.5v-2a2.5 2.5 0 0 1 5 0v2",
  edit: "M2.5 13.5h3l7.5-7.5-3-3-7.5 7.5v3ZM9 4l3 3",
  news: "M2.5 2.5h9v11h-9zM11.5 5.5h2v6.5a1.5 1.5 0 0 1-1.5 1.5M4.5 5h5M4.5 7.5h5M4.5 10h3",
  user: "M8 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 14.5c.6-2.9 3-4.5 6-4.5s5.4 1.6 6 4.5",
  id: "M1.5 3.5h13v9h-13zM4 6.5h3M4 9.5h5M10.5 6.5h1.5",
  chart: "M1.5 14.5h13M3.5 11.5v-3M7 11.5V5M10.5 11.5V7.5M14 11.5v-8",
  link: "M6.5 9.5l3-3M5 7.5 3.5 9a2.5 2.5 0 0 0 3.5 3.5L8.5 11M11 8.5 12.5 7A2.5 2.5 0 0 0 9 3.5L7.5 5",
} as const;
