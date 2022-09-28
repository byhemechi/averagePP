import {
  DB,
  type RowObject,
  type QueryParameter,
} from "https://deno.land/x/sqlite@v3.5.0/mod.ts";

const db = new DB("data.db");
export default db;

export function sql<T extends RowObject>(
  strings: TemplateStringsArray,
  ...values: QueryParameter[]
) {
  const query = db.prepareQuery<[], T>(strings.join("?"));
  return query.iterEntries(values);
}

export const init = () =>
  sql`CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT UNIQUE NOT NULL,
    population INTEGER(2),
    average REAL,
    median REAL
  )`;
