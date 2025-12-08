-- CreateEnum
CREATE TYPE "BreakerType" AS ENUM ('STANDARD', 'GFCI', 'AFCI', 'DUAL_FUNCTION');

-- CreateEnum
CREATE TYPE "NodeKind" AS ENUM ('OUTLET', 'OUTLET_240', 'SWITCH', 'DIMMER', 'LIGHT', 'FAN', 'APPLIANCE', 'COOKTOP', 'DRYER', 'AC', 'PANEL_FEED', 'OTHER');

-- CreateEnum
CREATE TYPE "NodeLinkKind" AS ENUM ('GFCI_PROTECTS', 'SWITCH_CONTROLS', 'FEEDS', 'OTHER');

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "kind" "NodeKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "rows" INTEGER,
    "columns" INTEGER,
    "parentPanelId" TEXT,
    "supplyBreakerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "label" TEXT,
    "amperage" INTEGER,
    "voltage" INTEGER,
    "color" TEXT,
    "notes" TEXT,
    "panelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breaker" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "slotNumber" INTEGER,
    "label" TEXT,
    "poleCount" INTEGER,
    "type" "BreakerType" NOT NULL DEFAULT 'STANDARD',
    "amperage" INTEGER,
    "voltage" INTEGER,
    "circuitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakerLink" (
    "id" TEXT NOT NULL,
    "breakerAId" TEXT NOT NULL,
    "breakerBId" TEXT NOT NULL,
    "kind" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreakerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "floorId" TEXT NOT NULL,
    "roomId" TEXT,
    "typeId" TEXT,
    "kind" "NodeKind" NOT NULL DEFAULT 'OUTLET',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION,
    "circuitId" TEXT,
    "isGfci" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeLink" (
    "id" TEXT NOT NULL,
    "kind" "NodeLinkKind" NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NodeType_key_key" ON "NodeType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Panel_supplyBreakerId_key" ON "Panel"("supplyBreakerId");

-- CreateIndex
CREATE UNIQUE INDEX "panel_slot_unique" ON "Breaker"("panelId", "slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "breaker_link_pair_unique" ON "BreakerLink"("breakerAId", "breakerBId");

-- CreateIndex
CREATE INDEX "NodeLink_fromId_idx" ON "NodeLink"("fromId");

-- CreateIndex
CREATE INDEX "NodeLink_toId_idx" ON "NodeLink"("toId");

-- CreateIndex
CREATE INDEX "NodeLink_kind_idx" ON "NodeLink"("kind");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panel" ADD CONSTRAINT "Panel_parentPanelId_fkey" FOREIGN KEY ("parentPanelId") REFERENCES "Panel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panel" ADD CONSTRAINT "Panel_supplyBreakerId_fkey" FOREIGN KEY ("supplyBreakerId") REFERENCES "Breaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circuit" ADD CONSTRAINT "Circuit_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breaker" ADD CONSTRAINT "Breaker_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breaker" ADD CONSTRAINT "Breaker_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakerLink" ADD CONSTRAINT "BreakerLink_breakerAId_fkey" FOREIGN KEY ("breakerAId") REFERENCES "Breaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakerLink" ADD CONSTRAINT "BreakerLink_breakerBId_fkey" FOREIGN KEY ("breakerBId") REFERENCES "Breaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "NodeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLink" ADD CONSTRAINT "NodeLink_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLink" ADD CONSTRAINT "NodeLink_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

