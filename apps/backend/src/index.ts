import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient, NodeKind, NodeLinkKind } from "@prisma/client";

const prisma = new PrismaClient();

async function buildServer() {
  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" }
      }
    }
  });

  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok" }));

  // Panels
  app.get("/api/panels", async () => prisma.panel.findMany());
  app.post("/api/panels", async (req, reply) => {
    const body = req.body as any;
    const panel = await prisma.panel.create({ data: body });
    return reply.code(201).send(panel);
  });
  app.patch("/api/panels/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const panel = await prisma.panel.update({ where: { id }, data: body });
    return reply.send(panel);
  });
  app.delete("/api/panels/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.panel.delete({ where: { id } });
    return reply.code(204).send();
  });

  // Circuits
  app.get("/api/circuits", async (req) => {
    const { panelId } = req.query as { panelId?: string };
    return prisma.circuit.findMany({ where: panelId ? { panelId } : undefined });
  });
  app.post("/api/circuits", async (req, reply) => {
    const body = req.body as any;
    const circuit = await prisma.circuit.create({ data: body });
    return reply.code(201).send(circuit);
  });
  app.patch("/api/circuits/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const circuit = await prisma.circuit.update({ where: { id }, data: body });
    return reply.send(circuit);
  });
  app.delete("/api/circuits/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.circuit.delete({ where: { id } });
    return reply.code(204).send();
  });

  // Breakers
  app.get("/api/breakers", async (req) => {
    const { panelId } = req.query as { panelId?: string };
    return prisma.breaker.findMany({ where: panelId ? { panelId } : undefined });
  });
  app.post("/api/breakers", async (req, reply) => {
    const body = req.body as any;
    const breaker = await prisma.breaker.create({ data: body });
    return reply.code(201).send(breaker);
  });
  app.patch("/api/breakers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const breaker = await prisma.breaker.update({ where: { id }, data: body });
    return reply.send(breaker);
  });
  app.delete("/api/breakers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.breaker.delete({ where: { id } });
    return reply.code(204).send();
  });

  // Breaker links (ties)
  app.get("/api/breaker-links", async () => {
    return prisma.breakerLink.findMany();
  });
  app.post("/api/breaker-links", async (req, reply) => {
    const body = req.body as any;
    const link = await prisma.breakerLink.create({ data: body });
    return reply.code(201).send(link);
  });
  app.delete("/api/breaker-links/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.breakerLink.delete({ where: { id } });
    return reply.code(204).send();
  });

  // Nodes (formerly outlets)
  app.get("/api/nodes", async (req) => {
    const { circuitId, floorId, roomId, unassigned } = req.query as {
      circuitId?: string;
      floorId?: string;
      roomId?: string;
      unassigned?: string;
    };
    return prisma.node.findMany({
      where: {
        circuitId: circuitId || undefined,
        floorId: floorId || undefined,
        roomId: roomId || undefined,
        ...(unassigned ? { circuitId: null } : {})
      }
    });
  });
  app.get("/api/nodes/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const node = await prisma.node.findUnique({ where: { id } });
    if (!node) return reply.code(404).send({ error: "NotFound" });
    return node;
  });
  app.post("/api/nodes", async (req, reply) => {
    const body = req.body as any;
    if (body.kind && !Object.values(NodeKind).includes(body.kind)) {
      return reply.code(400).send({ error: "Invalid kind" });
    }
    const node = await prisma.node.create({ data: body });
    return reply.code(201).send(node);
  });
  app.patch("/api/nodes/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const node = await prisma.node.update({ where: { id }, data: body });
    return reply.send(node);
  });
  app.delete("/api/nodes/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.node.delete({ where: { id } });
    return reply.code(204).send();
  });

  // Node links
  app.get("/api/node-links", async (req) => {
    const { fromId, toId, kind } = req.query as { fromId?: string; toId?: string; kind?: NodeLinkKind };
    return prisma.nodeLink.findMany({
      where: {
        fromId: fromId || undefined,
        toId: toId || undefined,
        kind: kind || undefined
      }
    });
  });
  app.post("/api/node-links", async (req, reply) => {
    const body = req.body as any;
    if (body.kind && !Object.values(NodeLinkKind).includes(body.kind)) {
      return reply.code(400).send({ error: "Invalid kind" });
    }
    const link = await prisma.nodeLink.create({ data: body });
    return reply.code(201).send(link);
  });
  app.delete("/api/node-links/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.nodeLink.delete({ where: { id } });
    return reply.code(204).send();
  });

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || "0.0.0.0";

  try {
    await app.listen({ port, host });
    app.log.info(`API listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

