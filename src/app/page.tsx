/**
 * Root route. The real app is a client-side experience (auth-gated routing,
 * Supabase session) so this server component just mounts the client router.
 */
import AppRouter from "@/components/AppRouter";

export default function Home() {
  return <AppRouter />;
}
