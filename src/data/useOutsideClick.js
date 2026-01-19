import { useEffect } from "react";

export function useOutsideClick(refs, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    // ✅ Normalize to array (supports single ref OR array)
    const refArray = Array.isArray(refs) ? refs : [refs];

    const listener = (event) => {
      const clickedInside = refArray.some(
        (ref) => ref?.current && ref.current.contains(event.target)
      );

      if (clickedInside) return;
      handler();
    };

    // Capture phase → works even if child stops propagation
    document.addEventListener("mousedown", listener, true);
    document.addEventListener("touchstart", listener, true);

    return () => {
      document.removeEventListener("mousedown", listener, true);
      document.removeEventListener("touchstart", listener, true);
    };
  }, [refs, handler, enabled]);
}
