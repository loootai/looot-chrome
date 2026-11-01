// Money and price labels. Catalog prices go down to fractions of a cent, so small amounts keep
// up to six decimals instead of rounding to $0.00. Words come from the message files.

import { t } from "./i18n";

/** "$0", "$0.0019", "$0.003598", "$0.05", "$1.20". */
export function usd(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "n/a";
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 0.01) {
    const two = abs.toFixed(2);
    // Keep a third and fourth decimal when rounding to cents would change the amount.
    return sign + "$" + (Math.abs(Number(two) - abs) < 1e-9 ? two : abs.toFixed(4).replace(/0+$/, ""));
  }
  return sign + "$" + abs.toFixed(6).replace(/0+$/, "");
}

/** Price of one public catalog item, e.g. "$0.0048 per call". */
export function itemPrice(price: { state?: string; amountMicros?: number | null; unit?: string } | null | undefined): string {
  if (!price || price.state !== "known" || price.amountMicros === null || price.amountMicros === undefined) return t("priceNotListed");
  const perResult = price.unit === "result";
  if (price.amountMicros === 0) return t(perResult ? "freePerResult" : "freePerCall");
  return t(perResult ? "pricePerResult" : "pricePerCall", usd(price.amountMicros / 1_000_000));
}

/** Cheapest listed price for a job, e.g. "from $0.0019 per call". */
export function jobFrom(p: { cheapestPerCall: number | null; cheapestPerResult: number | null } | undefined): string {
  if (!p) return t("priceLoading");
  if (p.cheapestPerCall !== null && p.cheapestPerCall > 0) return t("fromPerCall", usd(p.cheapestPerCall));
  if (p.cheapestPerCall === 0 && p.cheapestPerResult !== null && p.cheapestPerResult > 0) return t("freeOneProvider", usd(p.cheapestPerResult));
  if (p.cheapestPerCall === 0) return t("freeCheapest");
  if (p.cheapestPerResult !== null) return t("fromPerResult", usd(p.cheapestPerResult));
  return t("priceNotListed");
}

/** Parses a dollar field such as "0.05" or "$0.50". Returns null when it is not a positive amount. */
export function parseUsd(text: string): number | null {
  const n = Number(text.replace(/[$\s]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
