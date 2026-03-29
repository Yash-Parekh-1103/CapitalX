import { decimal, integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
export const userRoleEnum = pgEnum('role', ['investor', 'founder'])

//Investor & Founders 

export const usersTable = pgTable("users", {

  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('investor'),
  profileImage: varchar()

});

export type User = typeof usersTable.$inferSelect
export type NewUser = typeof usersTable.$inferInsert

//Startup Table

export const startupTable = pgTable("startup", {

  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  startup_id:integer().notNull(),
  email: varchar().notNull(),
  name: varchar().notNull(),
  logo: varchar().notNull(),
  industry: varchar().notNull(),
  description: varchar().notNull(),
  singlePrice: integer().notNull(),
  totalTarget: integer().notNull(),
  teamSize: integer().notNull(),
  
});

export type Startup = typeof startupTable.$inferSelect
export type NewStartup = typeof startupTable.$inferInsert

//Investment Table (Investments & Transactions)

export const investmentTable = pgTable("investment", {

  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  transactionId: varchar('transaction_id', { length: 255 }),
  email: varchar().notNull(),
  startup_id: integer().notNull(),
  amount:integer().notNull(), 
  paymentMethod: varchar('payment_method', { length: 50 }),
  upi_id:varchar().notNull(),
  card_num:integer().notNull(),
  equityOffered: decimal().notNull(), // Percentage
  
});

export type Investment = typeof investmentTable.$inferSelect
export type NewInvestment = typeof investmentTable.$inferInsert