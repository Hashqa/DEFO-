"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./api";

/** Redirige vers /login si aucun token n'est stocké. */
export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    }
  }, [router]);
}
