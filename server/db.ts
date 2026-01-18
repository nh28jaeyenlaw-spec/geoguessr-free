import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gameSessions, sessionPlayers, roundResults, InsertGameSession, InsertSessionPlayer, InsertRoundResult } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Game Session Queries
export async function createGameSession(session: InsertGameSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(gameSessions).values(session);
  return session.id;
}

export async function getGameSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGameSessionStatus(sessionId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(gameSessions).set({ status: status as any }).where(eq(gameSessions.id, sessionId));
}

export async function addPlayerToSession(player: InsertSessionPlayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sessionPlayers).values(player);
}

export async function getSessionPlayers(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, sessionId));
}

export async function saveRoundResult(result: InsertRoundResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(roundResults).values(result);
}

export async function updatePlayerScore(sessionId: string, userId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sessionPlayers).set({ score: points }).where(
    and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, userId))
  );
}

export async function updateCurrentPlayers(sessionId: string, increment: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const session = await getGameSession(sessionId);
  if (!session) throw new Error("Session not found");
  
  const newCount = Math.max(0, session.currentPlayers + increment);
  await db.update(gameSessions).set({ currentPlayers: newCount }).where(eq(gameSessions.id, sessionId));
}
