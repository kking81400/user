import { useQuery } from '@tanstack/react-query';
import { exploreApi } from '@/lib/api/explore';

export function useExploreGrid(page = 1, limit = 18, seed?: string) {
    return useQuery({
        queryKey: ['explore-grid', page, seed],
        queryFn: () => exploreApi.getGrid(page, limit, seed),
    });
}

export function useSearchShops(query: string) {
    return useQuery({
        queryKey: ['explore-shops', query],
        queryFn: () => exploreApi.searchShops(query),
        enabled: query.trim().length > 0, // فقط وقتی کاربر چیزی تایپ کرد درخواست بزنه
    });
}