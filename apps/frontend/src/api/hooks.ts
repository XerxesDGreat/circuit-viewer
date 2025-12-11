import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { Breaker, Circuit, Node, NodeLink } from "./types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

