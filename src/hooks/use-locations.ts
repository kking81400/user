"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLocations } from "@/lib/data/locations";

/** فایل استان/شهر فقط یک بار دانلود و کش می‌شود */
export function useLocations() {
    return useQuery({
        queryKey: ["locations"],
        queryFn: fetchLocations,
        staleTime: Infinity,
        gcTime: Infinity,
    });
}