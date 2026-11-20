// src/hooks/use-chat-history.ts
"use client";

import { useCallback, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchChatMessages, fetchChats } from "@/lib/api/chat";
import { useChatStore } from "@/store/chat-store";

/**
 * Loads the saved messages of the conversation with a shop and merges them into the chat store
 * (live messages from the socket keep flowing into the same store).
 *
 *   1. GET /user/home/chats/                       → find the conversation that belongs to this shop
 *   2. GET /user/home/chats/{id}/messages          → its messages (paged, older pages on scroll up)
 *
 * A shop you never wrote to has no conversation yet → nothing to load, empty state.
 * Pass 0 to stay idle (not logged in / shop not loaded).
 */
export function useChatHistory(shopId: number) {
    const enabled = shopId > 0;

    const chats = useQuery({
        queryKey: ["chats"],
        queryFn: fetchChats,
        enabled,
        staleTime: 30_000,
    });
    const conversationId = chats.data?.find((c) => c.shopId === shopId)?.conversationId ?? null;

    const messages = useInfiniteQuery({
        queryKey: ["chat-messages", conversationId],
        queryFn: ({ pageParam }) =>
            fetchChatMessages({ conversationId: conversationId as number, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
        enabled: conversationId !== null,
        staleTime: 30_000,
    });

    const { data, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = messages;

    useEffect(() => {
        if (!data) return;
        useChatStore.getState().mergeHistory(
            shopId,
            data.pages.flatMap((p) => p.items),
        );
    }, [data, shopId]);

    const loadOlder = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const retry = useCallback(() => {
        void chats.refetch();
        if (conversationId !== null) void refetch();
    }, [chats, conversationId, refetch]);

    return {
        isLoading: enabled && (chats.isPending || (conversationId !== null && messages.isPending)),
        isError: chats.isError || messages.isError,
        retry,
        hasOlder: !!hasNextPage,
        loadingOlder: isFetchingNextPage,
        loadOlder,
    };
}