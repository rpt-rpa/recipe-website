"use client";

/**
 * Client-side router + session orchestrator (the plan's "app.js").
 *
 * Listens to Supabase auth state and routes:
 *   - no session            → AuthScreen
 *   - session, no profile   → first-run Setup (Task 3)
 *   - session, has profile  → decision Wizard (Task 4)
 *
 * Notes:
 *  - We never `await` Supabase calls inside the onAuthStateChange callback
 *    (that can deadlock the client); the callback only stores the session.
 *  - The route is *derived* during render rather than written from an effect,
 *    so the only effects we keep are pure subscriptions / async kick-offs.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { hasProfile } from "@/lib/auth";
import Splash from "./Splash";
import AuthScreen from "./auth/AuthScreen";
import SetupFlow from "./setup/SetupFlow";
import AppShell from "./shell/AppShell";

type Route = "loading" | "auth" | "setup" | "wizard";

export default function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  // Tracks the profile lookup result, tagged with the user it applies to.
  const [profileFor, setProfileFor] = useState<{
    userId: string;
    has: boolean;
  } | null>(null);

  // Subscribe to auth state once.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Async: look up whether the signed-in user has a profile.
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let active = true;
    hasProfile(uid).then((has) => {
      if (active) setProfileFor({ userId: uid, has });
    });
    return () => {
      active = false;
    };
  }, [session]);

  // Derive the route from current state (no setState-in-effect).
  let route: Route;
  if (!sessionChecked) {
    route = "loading";
  } else if (!session?.user) {
    route = "auth";
  } else if (profileFor?.userId === session.user.id) {
    route = profileFor.has ? "wizard" : "setup";
  } else {
    route = "loading"; // profile lookup for this user not resolved yet
  }

  switch (route) {
    case "auth":
      return <AuthScreen />;
    case "setup":
      return (
        <SetupFlow
          userId={session!.user.id}
          onComplete={() =>
            setProfileFor({ userId: session!.user.id, has: true })
          }
        />
      );
    case "wizard":
      return <AppShell userId={session!.user.id} />;
    default:
      return <Splash subtitle="Warming up the kitchen…" />;
  }
}
