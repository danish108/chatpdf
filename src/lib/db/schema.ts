import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userSystemEnum = pgEnum("user_system_enum", ["system", "user"]);

export const chats = pgTable("chats", {
  id: serial("Id").primaryKey(),
  pdfName: text("pdf_Name").notNull(),
  pdfUrl: text("pdf_Url").notNull(),
  createdAt: timestamp("created_At").notNull().defaultNow(),
  userId: varchar("user_Id", { length: 256 }).notNull(),
  fileKey: text("file_Key").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  conetct: text("content").notNull(),
  createdAt: timestamp("created_At").notNull(),
  role: userSystemEnum("role").notNull(),
});
