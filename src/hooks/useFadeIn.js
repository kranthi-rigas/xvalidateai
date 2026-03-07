import { useEffect, useState } from "react";

/**
 * Returns inline styles that animate the element from invisible/shifted to
 * fully visible on mount. Use as a reusable page-entrance transition.
 *
 * @param {number} duration - Transition duration in ms (default 320)
 * @param {number} delay    - Delay before animation starts in ms (default 20)
 */
export default function useFadeIn(duration = 320, delay = 20) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, []);

  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
  };
}
