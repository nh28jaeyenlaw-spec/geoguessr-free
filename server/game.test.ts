import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as any,
  };

  return ctx;
}

describe("game router", () => {
  describe("createSession", () => {
    it("creates a new game session with 1v1 mode", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      expect(result).toHaveProperty("sessionId");
      expect(result.sessionId).toBeTruthy();
      expect(result.sessionId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it("creates a new game session with 2v2 mode", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.game.createSession({
        gameMode: "2v2",
        viewMode: "noMoving",
      });

      expect(result).toHaveProperty("sessionId");
      expect(result.sessionId).toBeTruthy();
    });

    it("creates a new game session with freeplay mode", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.game.createSession({
        gameMode: "freeplay",
        viewMode: "noZoom",
      });

      expect(result).toHaveProperty("sessionId");
      expect(result.sessionId).toBeTruthy();
    });
  });

  describe("getSession", () => {
    it("retrieves a game session with players", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      const getResult = await caller.game.getSession({
        sessionId: createResult.sessionId,
      });

      expect(getResult).toBeTruthy();
      expect(getResult?.id).toBe(createResult.sessionId);
      expect(getResult?.gameMode).toBe("1v1");
      expect(getResult?.viewMode).toBe("normal");
      expect(getResult?.status).toBe("waiting");
      expect(getResult?.players).toBeDefined();
      expect(getResult?.players?.length).toBe(1);
    });

    it("returns null for non-existent session", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.game.getSession({
        sessionId: "nonexistent-session-id",
      });

      expect(result).toBeNull();
    });
  });

  describe("joinSession", () => {
    it("allows a user to join a 1v1 session", async () => {
      const ctx1 = createAuthContext(1);
      const ctx2 = createAuthContext(2);
      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      const createResult = await caller1.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      const joinResult = await caller2.game.joinSession({
        sessionId: createResult.sessionId,
      });

      expect(joinResult).toEqual({ success: true });

      const getResult = await caller1.game.getSession({
        sessionId: createResult.sessionId,
      });

      expect(getResult?.players?.length).toBe(2);
    });

    it("prevents joining a full session", async () => {
      const ctx1 = createAuthContext(1);
      const ctx2 = createAuthContext(2);
      const ctx3 = createAuthContext(3);
      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);
      const caller3 = appRouter.createCaller(ctx3);

      const createResult = await caller1.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      await caller2.game.joinSession({
        sessionId: createResult.sessionId,
      });

      await expect(
        caller3.game.joinSession({
          sessionId: createResult.sessionId,
        })
      ).rejects.toThrow("Session is full");
    });
  });

  describe("startGame", () => {
    it("starts a game session", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      const startResult = await caller.game.startGame({
        sessionId: createResult.sessionId,
      });

      expect(startResult).toEqual({ success: true });

      const getResult = await caller.game.getSession({
        sessionId: createResult.sessionId,
      });

      expect(getResult?.status).toBe("playing");
    });
  });

  describe("saveRoundResult", () => {
    it("saves a round result for a player", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      const saveResult = await caller.game.saveRoundResult({
        sessionId: createResult.sessionId,
        roundNumber: 1,
        guessLat: "40.7128",
        guessLng: "-74.0060",
        actualLat: "40.7128",
        actualLng: "-74.0060",
        distanceKm: 0,
        points: 5000,
      });

      expect(saveResult).toEqual({ success: true });
    });

    it("saves a round result without guess coordinates", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.game.createSession({
        gameMode: "1v1",
        viewMode: "normal",
      });

      const saveResult = await caller.game.saveRoundResult({
        sessionId: createResult.sessionId,
        roundNumber: 1,
        actualLat: "40.7128",
        actualLng: "-74.0060",
        points: 0,
      });

      expect(saveResult).toEqual({ success: true });
    });
  });
});
