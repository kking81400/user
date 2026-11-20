import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reelsApi } from '@/lib/api/reels';

export function useReelComments(reelId: number) {
    return useQuery({
        queryKey: ['reel-comments', reelId],
        queryFn: () => reelsApi.getComments(reelId),
        enabled: !!reelId && !isNaN(reelId),
    });
}

export function useReelProducts(reelId: number) {
    return useQuery({
        queryKey: ['reel-products', reelId],
        queryFn: () => reelsApi.getReelProducts(reelId),
        enabled: !!reelId && !isNaN(reelId),
    });
}

export function useProductQuickView(productId: number | null) {
    return useQuery({
        queryKey: ['product-quick-view', productId],
        queryFn: () => reelsApi.getProductQuickView(productId!),
        enabled: !!productId,
    });
}

export function useLikeReel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reelId, action }: { reelId: number; action: 'like' | 'unlike' }) =>
            reelsApi.toggleLike(reelId, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['explore-feed'] });
        },
    });
}

export function useAddComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reelId, content, parentId }: { reelId: number; content: string; parentId?: number }) =>
            reelsApi.addComment(reelId, content, parentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['reel-comments', variables.reelId] });
        },
    });
}