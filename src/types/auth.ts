/**
 * NOTE ON RESPONSE ENVELOPE:
 * The exact JSON envelope your backend wraps responses in wasn't part of the
 * brief, so this assumes the common `{ success, message, data }` shape used
 * across most Iranian REST backends. If yours differs (e.g. no wrapper, or
 * `{ status, result }`), the ONLY place that needs to change is the
 * `unwrap()` function in `lib/api/http.ts` — every hook/component below
 * consumes the already-unwrapped `data` shape, so one edit fixes everywhere.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface GuestLoginResponse {
  guest_id: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

/** Returned by login/verify and register/verify once OTP is confirmed. */
export interface VerifyResponse extends AuthTokens {
  user?: AuthUser;
}

export interface AuthUser {
  id: string | number;
  phone: string;
  first_name?: string;
  last_name?: string;
  gender?: Gender;
}

export type Gender = "male" | "female";

export interface SendOtpResponse {
  /** Seconds until the user may request another code. Falls back to a sane default if absent. */
  expires_in?: number;
}

export interface RefreshTokenResponse extends AuthTokens {}

// ---- Request payloads (mirroring the endpoints exactly) ----

export interface LoginSendOtpPayload {
  phone: string;
}

export interface LoginVerifyPayload {
  phone: string;
  code: string;
  guest_id: string;
}

export interface RegisterSendOtpPayload {
  phone: string;
  first_name: string;
  last_name: string;
}

export interface RegisterVerifyPayload {
  phone: string;
  code: string;
  guest_id: string;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

/** Local UI state machine for the auth card. */
export type AuthTab = "register" | "login";
export type AuthStep = "form" | "otp";

export interface PendingOtpContext {
  tab: AuthTab;
  phone: string;
  /** Only present for register, needed if the user goes back and forward. */
  firstName?: string;
  lastName?: string;
}
