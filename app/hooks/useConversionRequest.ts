/**
 * app/hooks/useConversionRequest.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable hook encapsulating three critical production patterns:
 *
 *  1. AbortController  — cancels in-flight fetch when a new one starts or
 *                        when the component unmounts.
 *  2. Race-condition guard — a monotonic requestId nonce ensures a slow
 *                        previous response can never overwrite a newer result.
 *  3. Debounced submit — prevents duplicate submissions from rapid clicks.
 */

import { useRef, useState, useCallback, useEffect } from "react";

export type ConversionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Response }
  | { status: "error"; message: string }
  | { status: "cancelled" };

type UseConversionRequestOptions = {
  /** Debounce delay in ms before the fetch fires (default: 300ms) */
  debounceMs?: number;
};

export function useConversionRequest(options: UseConversionRequestOptions = {}) {
  const { debounceMs = 300 } = options;

  const [state, setState] = useState<ConversionState>({ status: "idle" });

  // AbortController ref — one per in-flight request
  const abortRef = useRef<AbortController | null>(null);
  // Monotonic request ID for race-condition guard
  const requestIdRef = useRef(0);
  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /**
   * Submit a fetch request with full guard suite.
   *
   * @param url      The API endpoint URL
   * @param init     Standard RequestInit (body, method, headers — do NOT set signal)
   */
  const submit = useCallback(
    (url: string, init: Omit<RequestInit, "signal"> = {}) => {
      // Clear any pending debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        // Abort any previous in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // Stamp this request with a unique ID
        const currentId = ++requestIdRef.current;

        setState({ status: "loading" });

        try {
          const res = await fetch(url, { ...init, signal: controller.signal });

          // Race-condition guard: discard stale responses
          if (requestIdRef.current !== currentId) return;

          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            setState({ status: "error", message: body.error ?? `HTTP ${res.status}` });
            return;
          }

          setState({ status: "success", data: res });
        } catch (err: any) {
          // Race-condition guard on error path too
          if (requestIdRef.current !== currentId) return;

          if (err?.name === "AbortError") {
            setState({ status: "cancelled" });
          } else {
            setState({ status: "error", message: err?.message ?? "Conversion failed" });
          }
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  /**
   * Cancel the current in-flight request immediately (e.g. user clicks "Cancel").
   */
  const cancel = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setState({ status: "cancelled" });
  }, []);

  /**
   * Reset state back to idle (e.g. when the user selects a new file).
   */
  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle" });
  }, [cancel]);

  return {
    state,
    isLoading: state.status === "loading",
    isError: state.status === "error",
    isSuccess: state.status === "success",
    submit,
    cancel,
    reset,
  };
}
