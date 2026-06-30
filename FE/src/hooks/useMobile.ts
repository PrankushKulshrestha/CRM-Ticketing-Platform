
import { useEffect, useState } from "react";

/**
 * Returns true when the viewport width is below `breakpoint` (px).
 * Defaults to the Tailwind `md` breakpoint (768 px).
 *
 * @example
 *   const isMobile = useMobile();
 *   return isMobile ? <MobileNav /> : <DesktopNav />;
 */
export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // Use modern addEventListener; fall back to deprecated addListener
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else {
      mq.addListener(handler); // Safari < 14
    }

    setIsMobile(mq.matches);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, [breakpoint]);

  return isMobile;
}