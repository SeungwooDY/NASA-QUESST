"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

export default function Navbar() {
  const { user, username, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <Link href="/" className="text-xl font-bold tracking-tight text-sky-400 hover:text-sky-300">
        ✈ Sonic Boom Simulator
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link href="/leaderboard" className="hover:text-sky-300 transition-colors">
          Leaderboard
        </Link>

        {!loading && (
          <>
            {user ? (
              <>
                <Link href="/designer" className="hover:text-sky-300 transition-colors">
                  Designer
                </Link>
                <Link href="/history" className="hover:text-sky-300 transition-colors">
                  My Runs
                </Link>
                <span className="text-slate-400">|</span>
                <span className="text-slate-300">{username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="hover:text-sky-300 transition-colors">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-sky-600 hover:bg-sky-500 px-3 py-1 rounded transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
