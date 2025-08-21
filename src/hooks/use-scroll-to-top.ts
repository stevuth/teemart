"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // This is a more robust way to scroll to the top that works
    // better with different browser behaviors and page structures.
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "instant" to avoid a visible scroll animation
    });
  }, [pathname]);
}
