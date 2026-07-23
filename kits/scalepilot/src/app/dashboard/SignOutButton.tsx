"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="px-6 py-3 bg-[#0D0D0B] hover:bg-[#252520] text-[#FFFFFF] border border-[#0D0D0B] font-mono text-xs uppercase tracking-widest font-bold transition-all cursor-pointer disabled:opacity-50"
    >
      {loading ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
