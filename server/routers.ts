import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  game: router({
    createSession: protectedProcedure
      .input(z.object({
        gameMode: z.enum(["1v1", "2v2", "freeplay"]),
        viewMode: z.enum(["normal", "noMoving", "noZoom"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = nanoid();
        const maxPlayers = input.gameMode === "1v1" ? 2 : input.gameMode === "2v2" ? 4 : 1;
        
        await db.createGameSession({
          id: sessionId,
          creatorId: ctx.user.id,
          gameMode: input.gameMode,
          viewMode: input.viewMode,
          maxPlayers,
          currentPlayers: 1,
          status: "waiting",
        });
        
        await db.addPlayerToSession({
          sessionId,
          userId: ctx.user.id,
          team: input.gameMode === "freeplay" ? "solo" : "team1",
          score: 0,
          roundsCompleted: 0,
        });
        
        return { sessionId };
      }),
    
    getSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = await db.getGameSession(input.sessionId);
        if (!session) return null;
        
        const players = await db.getSessionPlayers(input.sessionId);
        return { ...session, players };
      }),
    
    joinSession: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getGameSession(input.sessionId);
        if (!session) throw new Error("Session not found");
        if (session.currentPlayers >= session.maxPlayers) throw new Error("Session is full");
        
        const team = session.gameMode === "freeplay" ? "solo" : session.currentPlayers < session.maxPlayers / 2 ? "team1" : "team2";
        
        await db.addPlayerToSession({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          team,
          score: 0,
          roundsCompleted: 0,
        });
        
        await db.updateCurrentPlayers(input.sessionId, 1);
        
        return { success: true };
      }),
    
    startGame: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateGameSessionStatus(input.sessionId, "playing");
        return { success: true };
      }),
    
    saveRoundResult: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        roundNumber: z.number(),
        guessLat: z.string().optional(),
        guessLng: z.string().optional(),
        actualLat: z.string(),
        actualLng: z.string(),
        distanceKm: z.number().optional(),
        points: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveRoundResult({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          roundNumber: input.roundNumber,
          guessLat: input.guessLat,
          guessLng: input.guessLng,
          actualLat: input.actualLat,
          actualLng: input.actualLng,
          distanceKm: input.distanceKm,
          points: input.points,
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
