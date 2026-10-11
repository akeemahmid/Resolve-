import type { InterpretationResult } from "./provider";
// Deliberately conservative: only a high-confidence, source-backed monetary quote
// can satisfy external dependencies. This function has no database or AI access.
export function quoteDecision(
  result: InterpretationResult,
  body: string,
  requestedCurrency: string,
) {
  if (
    /ignore\b[\s\S]{0,60}\binstructions|mark\b[\s\S]{0,100}\bresolved|approve\s+(?:my|this|the)\s+(?:\$[\d,.]+\s+)?quote/i.test(
      body,
    )
  )
    return { reason: "Instruction-like email requires human review." };
  if (
    result.confidence !== "HIGH" ||
    result.intent !== "QUOTE" ||
    result.completionClaim
  )
    return {
      reason:
        "This reply requires human follow-up; no quote dependency was satisfied.",
    };
  const { amount, currency, evidence } = result.quote;
  if (
    amount === null ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1_000_000 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001 ||
    !evidence ||
    !body.includes(evidence)
  )
    return { reason: "Quote amount or source evidence is missing or invalid." };
  const tokens = evidence.match(/\d[\d,.]*/g) ?? [];
  if (
    tokens.some(
      (x) =>
        !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(
          x.replace(/\.$/, ""),
        ),
    ) ||
    /\d\s*(?:-|to)\s*[$€£]?\d|per\s+(?:hour|day)|\/(?:hr|hour)|\bhourly\b/i.test(
      evidence,
    )
  )
    return { reason: "Quote is a rate, range or malformed amount; follow up." };
  const amounts = tokens.map((x) =>
    Number(x.replace(/,/g, "").replace(/\.$/, "")),
  );
  if (!amounts.includes(amount))
    return { reason: "Quote amount does not match its source excerpt." };
  // A bare dollar sign is scoped only by the human-selected requested currency.
  // Other ambiguous symbols or currencies require follow-up, never model guessing.
  const explicit =
    evidence
      .match(/\b(?:USD|GBP|EUR|NGN|CAD|AUD)\b/gi)
      ?.map((x) => x.toUpperCase()) ?? [];
  let resolved = currency?.toUpperCase() ?? null;
  if (resolved && !explicit.includes(resolved))
    return {
      reason: "Interpreted currency is not supported by the quote excerpt.",
    };
  if (
    !resolved &&
    explicit.length === 0 &&
    evidence.includes("$") &&
    !/[€£₦]/.test(evidence) &&
    ["USD", "CAD", "AUD"].includes(requestedCurrency)
  )
    resolved = requestedCurrency;
  if (
    !resolved ||
    resolved !== requestedCurrency ||
    explicit.some((x) => x !== resolved)
  )
    return {
      reason:
        "Currency is ambiguous or differs from the requested currency; follow up.",
    };
  return {
    amount,
    currency: resolved,
    evidence,
    reason: "Source-backed quote received. Human approval is required.",
  };
}
