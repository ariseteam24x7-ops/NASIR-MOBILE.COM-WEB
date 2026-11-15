import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const mysqlHost = process.env.MYSQL_HOST || process.env.SQL_HOST;
const mysqlDbName = process.env.MYSQL_DATABASE || process.env.SQL_DB_NAME;
const user =
  process.env.MYSQL_ADMIN_USER ||
  process.env.MYSQL_USER ||
  process.env.SQL_ADMIN_USER ||
  process.env.SQL_USER;
const password =
  process.env.MYSQL_ADMIN_PASSWORD ||
  process.env.MYSQL_PASSWORD ||
  process.env.SQL_ADMIN_PASSWORD ||
  process.env.SQL_PASSWORD ||
  "";
const port = Number(process.env.MYSQL_PORT || process.env.SQL_PORT) || 3306;

if (!mysqlHost) {
  throw new Error("MYSQL_HOST (or SQL_HOST) must be set in environment variables.");
}
if (!mysqlDbName) {
  throw new Error("MYSQL_DATABASE (or SQL_DB_NAME) must be set in environment variables.");
}
if (!user) {
  throw new Error("MYSQL_USER (or SQL_USER) must be set in environment variables.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: mysqlHost,
    port,
    user,
    password,
    database: mysqlDbName,
  },
  verbose: true,
});
