import React from "react";
import useFadeIn from "@/hooks/useFadeIn";

/**
 * Wraps any page/view with a smooth fade-in + slide-up entrance animation.
 * Re-animates on every mount, so switching views will always feel smooth.
 *
 * Usage:
 *   <PageTransition>
 *     <MyView />
 *   </PageTransition>
 *
 * Props:
 *   duration  {number}  Transition duration in ms (default 320)
 *   delay     {number}  Delay before the animation starts in ms (default 20)
 *   style     {object}  Extra inline styles for the wrapper div
 */
export default function PageTransition({ children, duration = 320, delay = 20, style = {} }) {
  const fadeStyle = useFadeIn(duration, delay);

  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ ...fadeStyle, ...style }}>
        {children}
      </div>
    </div>
  );
}
