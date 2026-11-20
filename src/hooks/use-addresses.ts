"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addressApi } from "@/lib/api/addresses";
import type { AddressPayload } from "@/types/profile";

export const addressKeys = { all: ["addresses"] as const };

export function useAddresses() {
    return useQuery({ queryKey: addressKeys.all, queryFn: addressApi.list });
}

function useAddressMutation<TVars>(
    fn: (v: TVars) => Promise<unknown>,
    successMessage: string
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: () => {
            toast.success(successMessage);
            qc.invalidateQueries({ queryKey: addressKeys.all });
        },
        onError: () => toast.error("خطایی رخ داد. دوباره تلاش کنید."),
    });
}

export const useCreateAddress = () =>
    useAddressMutation((p: AddressPayload) => addressApi.create(p), "آدرس ثبت شد");

export const useUpdateAddress = () =>
    useAddressMutation(
        ({ id, payload }: { id: number; payload: AddressPayload }) => addressApi.update(id, payload),
        "آدرس ویرایش شد"
    );

export const useDeleteAddress = () =>
    useAddressMutation((id: number) => addressApi.remove(id), "آدرس حذف شد");