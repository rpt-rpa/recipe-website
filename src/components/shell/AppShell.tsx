"use client";

/**
 * App shell — hosts the bottom nav bar and routes between the three top-level tabs:
 * Home (wizard), History, and Profile.
 */
import { useState } from "react";
import BottomNav, { type Tab } from "./BottomNav";
import Wizard from "@/components/wizard/Wizard";
import History from "@/components/history/History";
import Profile from "@/components/profile/Profile";

export default function AppShell({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className="relative min-h-screen bg-cream">
      {tab === "home" && <Wizard userId={userId} />}
      {tab === "history" && <History userId={userId} />}
      {tab === "profile" && <Profile userId={userId} />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
