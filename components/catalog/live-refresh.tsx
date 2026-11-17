"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const INTERVAL_MS = 30_000;

export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    function start() {
      stop();
      timer = setInterval(() => router.refresh(), INTERVAL_MS);
    }

    function stop() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
