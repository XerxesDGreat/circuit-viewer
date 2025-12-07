export type OutletKind = "OUTLET" | "SWITCH" | "LIGHT" | "APPLIANCE";

export type Outlet = {
  id: string;
  name: string;
  kind: OutletKind;
  x: number;
  y: number;
  rotation?: number;
  circuitId?: string | null;
  room?: string;
  isGfci?: boolean;
  gfciProtectsIds?: string[];
};

export type Circuit = {
  id: string;
  label: string;
  amperage?: number;
  voltage?: number;
  color?: string;
};

export type FloorPlan = {
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundImageUrl?: string;
};

