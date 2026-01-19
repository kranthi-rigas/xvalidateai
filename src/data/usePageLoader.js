import { useEffect, useState } from "react";

export default function usePageLoader(deps = []) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ready = deps.every(
      (d) => d !== undefined && d !== null
    );

    if (ready) setLoading(false);
  }, deps);

  return loading;
}
