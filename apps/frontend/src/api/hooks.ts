import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { Breaker, BreakerLink, Circuit, Node, NodeLink } from "./types";

export function useCircuits(enabled = true) {
  return useQuery<Circuit[]>({
    queryKey: ["circuits"],
    queryFn: () => api.get<Circuit[]>("/api/circuits"),
    enabled
  });
}

export function useNodes(enabled = true) {
  return useQuery<Node[]>({
    queryKey: ["nodes"],
    queryFn: () => api.get<Node[]>("/api/nodes"),
    enabled
  });
}

export function useNodeLinks(enabled = true) {
  return useQuery<NodeLink[]>({
    queryKey: ["node-links"],
    queryFn: () => api.get<NodeLink[]>("/api/node-links"),
    enabled
  });
}

export function useBreakers(enabled = true) {
  return useQuery<Breaker[]>({
    queryKey: ["breakers"],
    queryFn: () => api.get<Breaker[]>("/api/breakers"),
    enabled
  });
}

export function useBreakerLinks(enabled = true) {
  return useQuery<BreakerLink[]>({
    queryKey: ["breaker-links"],
    queryFn: () => api.get<BreakerLink[]>("/api/breaker-links"),
    enabled
  });
}

export function useUpdateNodePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; x: number; y: number }) =>
      api.patch<Node>(`/api/nodes/${params.id}`, { x: params.x, y: params.y }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    }
  });
}

export function useCreateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Node>) => api.post<Node>("/api/nodes", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    }
  });
}

export function useCreateNodeLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NodeLink>) => api.post<NodeLink>("/api/node-links", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["node-links"] });
    }
  });
}

export function useCreateBreaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Breaker>) => api.post<Breaker>("/api/breakers", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breakers"] })
  });
}

export function useUpdateBreaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; data: Partial<Breaker> }) =>
      api.patch<Breaker>(`/api/breakers/${payload.id}`, payload.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breakers"] })
  });
}

export function useBreakerLinkMutations() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (body: Partial<BreakerLink>) => api.post<BreakerLink>("/api/breaker-links", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breaker-links"] })
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/api/breaker-links/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breaker-links"] })
  });
  return { create, remove };
}

