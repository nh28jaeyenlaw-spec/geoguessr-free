import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Game Sessions for multiplayer
export const gameSessions = mysqlTable("gameSessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // UUID
  creatorId: int("creatorId").notNull(),
  gameMode: mysqlEnum("gameMode", ["1v1", "2v2", "freeplay"]).default("freeplay").notNull(),
  viewMode: mysqlEnum("viewMode", ["normal", "noMoving", "noZoom"]).default("normal").notNull(),
  maxPlayers: int("maxPlayers").default(2).notNull(),
  currentPlayers: int("currentPlayers").default(1).notNull(),
  status: mysqlEnum("status", ["waiting", "playing", "finished"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  finishedAt: timestamp("finishedAt"),
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;

// Players in a game session
export const sessionPlayers = mysqlTable("sessionPlayers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  team: mysqlEnum("team", ["team1", "team2", "solo"]).default("solo").notNull(),
  score: int("score").default(0).notNull(),
  roundsCompleted: int("roundsCompleted").default(0).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type SessionPlayer = typeof sessionPlayers.$inferSelect;
export type InsertSessionPlayer = typeof sessionPlayers.$inferInsert;

// Round results for each player
export const roundResults = mysqlTable("roundResults", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  roundNumber: int("roundNumber").notNull(),
  guessLat: varchar("guessLat", { length: 32 }),
  guessLng: varchar("guessLng", { length: 32 }),
  actualLat: varchar("actualLat", { length: 32 }).notNull(),
  actualLng: varchar("actualLng", { length: 32 }).notNull(),
  distanceKm: int("distanceKm"),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoundResult = typeof roundResults.$inferSelect;
export type InsertRoundResult = typeof roundResults.$inferInsert;