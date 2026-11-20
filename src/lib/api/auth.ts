import { http, unwrap } from "./http";
import type {
  ApiEnvelope,
  GuestLoginResponse,
  LoginSendOtpPayload,
  LoginVerifyPayload,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RegisterSendOtpPayload,
  RegisterVerifyPayload,
  SendOtpResponse,
  VerifyResponse,
} from "@/types/auth";

const BASE = "/user/auth";

export const authApi = {
  guestLogin: async (): Promise<GuestLoginResponse> => {
    const { data } = await http.post<ApiEnvelope<GuestLoginResponse>>(
      `${BASE}/guest-login`,
    );
    return unwrap(data);
  },

  loginSendOtp: async (
    payload: LoginSendOtpPayload,
  ): Promise<SendOtpResponse> => {
    const { data } = await http.post<ApiEnvelope<SendOtpResponse>>(
      `${BASE}/login/send-otp`,
      payload,
    );
    return unwrap(data);
  },

  loginVerify: async (payload: LoginVerifyPayload): Promise<VerifyResponse> => {
    const { data } = await http.post<ApiEnvelope<VerifyResponse>>(
      `${BASE}/login/verify`,
      payload,
    );
    return unwrap(data);
  },

  registerSendOtp: async (
    payload: RegisterSendOtpPayload,
  ): Promise<SendOtpResponse> => {
    const { data } = await http.post<ApiEnvelope<SendOtpResponse>>(
      `${BASE}/register/send-otp`,
      payload,
    );
    return unwrap(data);
  },

  registerVerify: async (
    payload: RegisterVerifyPayload,
  ): Promise<VerifyResponse> => {
    const { data } = await http.post<ApiEnvelope<VerifyResponse>>(
      `${BASE}/register/verify`,
      payload,
    );
    return unwrap(data);
  },

  refreshToken: async (
    payload: RefreshTokenPayload,
  ): Promise<RefreshTokenResponse> => {
    const { data } = await http.post<ApiEnvelope<RefreshTokenResponse>>(
      `${BASE}/refresh-token`,
      payload,
    );
    return unwrap(data);
  },
};
