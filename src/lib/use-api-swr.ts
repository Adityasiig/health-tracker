"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { useEffect } from "react";
import { swrFetcher } from "./api";
import { useToast } from "@/components/toast";

/**
 * Drop-in replacement for `useSWR` that automatically surfaces fetch
 * errors as toast messages. Same return shape, so existing code keeps
 * working — just swap the import.
 *
 *   - import useSWR from "swr";
 *   + import { useApiSWR } from "@/lib/use-api-swr";
 *   - useSWR<T>("/api/foo", swrFetcher);
 *   + useApiSWR<T>("/api/foo");
 */
export function useApiSWR<T>(key: string | null, options?: SWRConfiguration) {
  const result = useSWR<T>(key, swrFetcher, options);
  const { push } = useToast();

  useEffect(() => {
    if (result.error && key) {
      const msg = (result.error as Error).message || "Network error";
      push(`${key.replace("/api/", "")} failed — ${msg}`, "error");
    }
  // We only want to fire when the error identity changes (not on key change without error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.error?.message, key]);

  return result;
}
