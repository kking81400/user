"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileApi } from "@/lib/api/profile";
import type { ExtraInfo } from "@/types/profile";

export const profileKeys = {
  all: ["profile"] as const,
  settings: ["profile", "settings"] as const,
  avatars: ["profile", "avatars"] as const,
};

export function useProfile() {
  return useQuery({ queryKey: profileKeys.all, queryFn: profileApi.get });
}

/**
 * GET /settings: اگر کد ملی، تاریخ تولد، شبا یا کارت را برگرداند، نمایش داده می‌شود.
 * ساختار پاسخ مشخص نیست، پس چند حالت محتمل را می‌خوانیم.
 */
export function useExtraInfo(): ExtraInfo {
  const { data } = useQuery({
    queryKey: profileKeys.settings,
    queryFn: profileApi.settings,
    retry: false,
  });
  if (!data) return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src: any = { ...data, ...(data as any).personal_info, ...(data as any).financial_info };
  return {
    national_id: src.national_id,
    birth_date: src.birth_date,
    iban: src.iban,
    card_number: src.card_number,
  };
}

export function useAvatars(enabled = true) {
  return useQuery({
    queryKey: profileKeys.avatars,
    queryFn: profileApi.avatars,
    enabled,
  });
}

function useProfileMutation<TVars>(
    fn: (v: TVars) => Promise<unknown>,
    successMessage: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(successMessage);
      qc.invalidateQueries({ queryKey: profileKeys.all });
    },
    onError: () => toast.error("خطایی رخ داد. دوباره تلاش کنید."),
  });
}

export const useUpdateAvatar = () =>
    useProfileMutation(profileApi.updateAvatar, "تصویر پروفایل تغییر کرد");
export const useUpdatePersonalInfo = () =>
    useProfileMutation(profileApi.updatePersonalInfo, "اطلاعات فردی ذخیره شد");
export const useUpdateFinancialInfo = () =>
    useProfileMutation(profileApi.updateFinancialInfo, "اطلاعات مالی ذخیره شد");