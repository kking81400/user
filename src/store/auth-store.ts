import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import type { AuthTokens, AuthUser } from "@/types/auth";

const COOKIE_NAME = "auth-storage";
const COOKIE_EXPIRES_DAYS = 30;

/** Adapts js-cookie to zustand's persist storage interface so tokens live in a cookie
 *  (readable by Next.js middleware later, e.g. to protect routes) instead of localStorage. */
const cookieStorage: StateStorage = {
  getItem: (name) => Cookies.get(name) ?? null,
  setItem: (name, value) =>
    Cookies.set(name, value, {
      expires: COOKIE_EXPIRES_DAYS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }),
  removeItem: (name) => Cookies.remove(name),
};

interface AuthState {
  guestId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** true once the persisted store has finished reading from the cookie on the client */
  hasHydrated: boolean;

  setGuestId: (guestId: string) => void;
  setTokens: (tokens: AuthTokens, user?: AuthUser) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      guestId: null,
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,

      setGuestId: (guestId) => set({ guestId }),

      setTokens: (tokens, user) =>
        set((state) => ({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          user: user ?? state.user,
        })),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          // keep guestId: a logged-out visitor is still a "guest" for the next login attempt
        }),

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: COOKIE_NAME,
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        guestId: state.guestId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const isAuthenticated = () => Boolean(useAuthStore.getState().accessToken);
