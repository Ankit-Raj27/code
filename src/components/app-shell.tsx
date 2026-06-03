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

function SyncPill() {
  const { online, syncing, syncError, lastSyncAt } = useApp();

  if (syncing) {
    return <span className="pill">Syncing</span>;
  }

  if (!online) {
    return <span className="pill warning">Offline</span>;
  }

  if (syncError) {
    return <span className="pill danger">Sync issue</span>;
  }

  if (lastSyncAt) {
    return <span className="pill subtle">Synced</span>;
  }

  return <span className="pill subtle">Local-first</span>;
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
            <h1 className="text-[1.05rem] font-black">Progress</h1>
          </div>
          <SyncPill />
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
