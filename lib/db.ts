import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { pgTable, serial, text, timestamp, uuid, varchar, boolean, integer, real } from "drizzle-orm/pg-core"

// 環境変数からデータベース接続文字列を取得
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// タスクリストテーブル
export const taskLists = pgTable("task_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// タスクテーブル
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  listId: uuid("list_id")
    .notNull()
    .references(() => taskLists.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("未着手").notNull(),
  assignedTo: varchar("assigned_to", { length: 100 }),
  completed: boolean("completed").default(false).notNull(),
  progressPercentage: integer("progress_percentage").default(0), // 進捗パーセンテージを追加
  priority: real("priority"), // 優先順位を追加（小数点対応）
  position: integer("position").default(0).notNull(), // 並び順を追加
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// コメントテーブル
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userName: varchar("user_name", { length: 100 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// タイプ定義
export type TaskList = typeof taskLists.$inferSelect
export type Task = typeof tasks.$inferSelect
export type Comment = typeof comments.$inferSelect

export type NewTaskList = typeof taskLists.$inferInsert
export type NewTask = typeof tasks.$inferInsert
export type NewComment = typeof comments.$inferInsert
