"use client";

import { useQuery } from "@tanstack/react-query";
import { homeApi } from "@/lib/api/home";

const FIVE_MIN = 5 * 60 * 1000;

export const useExplore = (enabled = true) =>
    useQuery({ queryKey: ["home", "explore"], queryFn: homeApi.explore, enabled, staleTime: FIVE_MIN });

export const useFollowing = (enabled = true) =>
    useQuery({ queryKey: ["home", "following"], queryFn: homeApi.following, enabled, staleTime: FIVE_MIN });

export const useStories = () =>
    useQuery({ queryKey: ["home", "stories"], queryFn: homeApi.stories, staleTime: FIVE_MIN });

export const useSuggestedShops = () =>
    useQuery({ queryKey: ["home", "suggested-shops"], queryFn: homeApi.suggestedShops, staleTime: FIVE_MIN });