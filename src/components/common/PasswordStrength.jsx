import React from "react";
import { getPasswordChecks } from "@/utils/password";
import "./PasswordStrength.css";

// Meter class per number of satisfied rules — a color-only line, no label.
const STRENGTH_CLASS = [
  "",
  "pw-strength--weak",
  "pw-strength--weak",
  "pw-strength--fair",
  "pw-strength--good",
  "pw-strength--strong",
];

// How long a rule stays visible (green) after it becomes satisfied, before
// it disappears from the list.
const GRACE_MS = 800;

export function PasswordStrength({ password = "", show = false }) {
  const { checks, metCount } = getPasswordChecks(password);

  // Keys of rules that just turned valid — kept on screen (green) briefly so
  // the user sees the confirmation, then removed.
  const [graceKeys, setGraceKeys] = React.useState(() => new Set());
  const prevMet = React.useRef({});
  const timers = React.useRef({});

  React.useEffect(() => {
    const current = getPasswordChecks(password).checks;
    current.forEach((c) => {
      const was = prevMet.current[c.key];
      if (c.met && !was) {
        // Just became valid → flash green, then fade out.
        setGraceKeys((prev) => new Set(prev).add(c.key));
        clearTimeout(timers.current[c.key]);
        timers.current[c.key] = setTimeout(() => {
          setGraceKeys((prev) => {
            const next = new Set(prev);
            next.delete(c.key);
            return next;
          });
        }, GRACE_MS);
      } else if (!c.met && was) {
        // Reverted to invalid → cancel the flash, show as pending again.
        clearTimeout(timers.current[c.key]);
        setGraceKeys((prev) => {
          if (!prev.has(c.key)) return prev;
          const next = new Set(prev);
          next.delete(c.key);
          return next;
        });
      }
      prevMet.current[c.key] = c.met;
    });
  }, [password]);

  React.useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  // Hidden until the user focuses the field (show) or starts typing.
  if (!password && !show) return null;

  // Show only unmet rules, plus any that just turned green (still in grace).
  // With an empty field on focus, this lists every rule as pending.
  const visible = checks.filter((c) => !c.met || graceKeys.has(c.key));

  // Once every rule is satisfied and the last green flash has faded, hide the
  // whole widget — meter and checklist both disappear.
  if (metCount === checks.length && visible.length === 0) return null;

  return (
    <div className="pw-strength">
      <div className="pw-strength__track">
        <div
          className={`pw-strength__bar ${STRENGTH_CLASS[metCount]}`}
          style={{ width: `${(metCount / checks.length) * 100}%` }}
        />
      </div>
      {visible.length > 0 && (
        <ul className="pw-strength__reqs">
          {visible.map((check) => (
            <li key={check.key} className={check.met ? "is-met" : "is-unmet"}>
              {/* data-fa-i2svg="false": this app loads FontAwesome's CSS and
                  its JS engine, and without the opt-out both draw the icon. */}
              <i
                className={`fa-solid ${check.met ? "fa-circle-check" : "fa-circle"}`}
                data-fa-i2svg="false"
                aria-hidden="true"
              ></i>
              {check.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordStrength;
