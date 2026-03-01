import { integer, pgTable, varchar } from "drizzle-orm/pg-core";


export const startupTable = pgTable("startup", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull(),
    img: varchar().notNull(),
    description: varchar().notNull(),
    singleFund: integer().notNull(),
    totalTarget: integer().notNull(),
    email: varchar().notNull()

});

export type Startup = typeof startupTable.$inferSelect
export type NewStartup = typeof startupTable.$inferInsert
