"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Scale, Soup, UserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLoader } from "@/components/loader";
import { NAV_ITEMS } from "@/lib/constants";
import { useApp } from "@/hooks/use-app";

const navIcons = {
  Today: Activity,
  Weight: Scale,
  Diet: Soup,
  Workout: Dumbbell,
  Profile: UserRound
};

function HeaderAction() {
  const { session, online, syncing, syncError, lastSyncAt } = useApp();

  let syncLabel: string | null = null;
  let syncClassName = "pill subtle";

  if (syncing) {
    syncLabel = "Syncing";
    syncClassName = "pill";
  } else if (!online) {
    syncLabel = "Offline";
    syncClassName = "pill warning";
  } else if (syncError) {
    syncLabel = "Sync issue";
    syncClassName = "pill danger";
  } else if (lastSyncAt) {
    syncLabel = "Synced";
  }

  return (
    <div className="header-actions">
      <Link
        href="/profile"
        className="button"
        style={{ minHeight: "auto", padding: "0.6rem 1rem", fontSize: "0.8rem" }}
      >
        {session ? "Open profile" : "Sign in"}
      </Link>
      {session && syncLabel ? <span className={syncClassName}>{syncLabel}</span> : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hydrated } = useApp();

  return (
    <>
      <AnimatePresence mode="wait">
        {!hydrated && <AppLoader key="loader" />}
      </AnimatePresence>
      <motion.div
        className="app-frame"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="topbar">
          <div>
            <p className="eyebrow">Shared progress</p>
            <h1 className="text-[0.95rem] font-black">Progress</h1>
          </div>
          <HeaderAction />
        </header>
        <motion.main
          key={pathname}
          className="page-content"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          {children}
        </motion.main>
        <nav className="bottom-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (pathname === "/" && item.href === "/today");
            const Icon = navIcons[item.label as keyof typeof navIcons];

            return (
              <Link
                key={item.href}
                className={active ? "nav-link active" : "nav-link"}
                href={item.href}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={active ? 2.6 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
}
