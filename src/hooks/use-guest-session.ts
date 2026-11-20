"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";

/**
 * The backend's login/register verify endpoints require a `guest_id`.
 * This hook lazily creates (and caches) one guest session per device,
 * calling guest-login only when no guest_id is already stored.
 */
export function useGuestSession() {
  const guestId = useAuthStore((s) => s.guestId);
  const setGuestId = useAuthStore((s) => s.setGuestId);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: authApi.guestLogin,
    onSuccess: (data) => setGuestId(data.guest_id),
  });

  /** Returns a guaranteed guest_id, creating one first if needed. */
  const ensureGuestId = useCallback(async (): Promise<string> => {
    if (guestId) return guestId;
    const data = await mutateAsync();
    return data.guest_id;
  }, [guestId, mutateAsync]);

  return { guestId, ensureGuestId, isCreatingGuest: isPending };
}
