import { create } from "zustand";

type SelectionState = {
  selectedCircuitId: string | null;
  selectedOutletId: string | null;
  selectCircuit: (id: string | null) => void;
  selectOutlet: (id: string | null) => void;
  clear: () => void;
};

export const useSelection = create<SelectionState>((set) => ({
  selectedCircuitId: null,
  selectedOutletId: null,
  selectCircuit: (id) =>
    set(() => ({
      selectedCircuitId: id,
      selectedOutletId: null
    })),
  selectOutlet: (id) =>
    set((state) => ({
      selectedOutletId: id,
      selectedCircuitId: state.selectedCircuitId
    })),
  clear: () => set({ selectedCircuitId: null, selectedOutletId: null })
}));

