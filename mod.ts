import { components as ScoreSaber } from "./types/scoresaber.ts";
import getPage from "./getPage.ts";
import { init, sql } from "./db.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";

const countries = Deno.args;
assert(countries.length > 0, "No countries specified");

const threads = 20;

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

type CountryRow = {
  country: string;
  average: number;
  median: number;
  population: number;
};

init();

for (const country of countries) {
  console.log(country, "\n");
  const page1 = await getPage(1, country);

  if (page1 == null) throw "Failed to load page 1";

  const { metadata } = page1;
  const players: ScoreSaber["schemas"]["Player"][] = [];
  let reset = Infinity;
  const pages = Math.ceil(metadata.total / metadata.itemsPerPage);

  for (let i = 0; i < pages / threads; ++i) {
    console.log("\x1b[1A", i * threads, pages, (i / (pages / threads)) * 100);
    await Promise.all(
      new Array(pages)
        .fill(null)
        .splice(i * threads, threads)
        .map(async (_, n) => {
          const page = i * threads + n;
          const pageData = await getPage(page, country);
          reset = Math.min(reset, parseInt(pageData.reset ?? "999999999"));
          if (pageData == null) throw page;

          players.push(...pageData.players);
        })
    );
  }
  const averageRank =
    players.reduce((prev, current) => {
      return prev + current.pp;
    }, 0) / players.length;

  sql`INSERT OR REPLACE INTO countries(country, average, median, population) VALUES
    (
      ${country},
      ${averageRank},
      ${players[Math.floor(players.length / 2)].pp},
      ${metadata.total}
    )`;

  console.table(
    await Promise.all(sql<CountryRow>`SELECT * from countries ORDER BY average`)
  );

  await sleep(Date.now() - reset * 1000);
}
