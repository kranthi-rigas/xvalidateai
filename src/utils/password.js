// Single source of truth for password rules, shared by Sign up, Reset password
// and the Settings password tab so all three validate and read identically.
export const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
  {
    key: "special",
    label: "One special character",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function getPasswordChecks(password = "") {
  const checks = PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    met: rule.test(password),
  }));
  const metCount = checks.filter((c) => c.met).length;
  return {
    checks,
    metCount,
    requiredMet: metCount === PASSWORD_RULES.length,
  };
}

// "Password must include one uppercase letter, one number" — the message a
// form shows when submit is blocked.
export function describeMissingRules(password = "") {
  const missing = getPasswordChecks(password).checks.filter((c) => !c.met);
  if (!missing.length) return "";
  return `Password must include ${missing
    .map((r) => r.label.toLowerCase())
    .join(", ")}`;
}

// "match" | "mismatch" | undefined — the class suffix the three password forms
// use to colour their fields. Undefined until both boxes have something in
// them, so a half-typed confirmation is never flagged as wrong.
export function confirmationState(password = "", confirmation = "") {
  if (!password || !confirmation) return undefined;
  return password === confirmation ? "match" : "mismatch";
}

// Ready-to-use class name for the pair of inputs.
export function confirmationClass(password = "", confirmation = "") {
  const state = confirmationState(password, confirmation);
  return state ? `pw-${state}` : "";
}
