"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function usePageLoading() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate a slight loading delay for page transitions
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return isLoading;
}
