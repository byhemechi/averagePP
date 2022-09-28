import { components as ScoreSaber } from "./types/scoresaber.ts";
import getPage from "./getPage.ts";
import raw from "./data.json" assert { type: "json" };

const countries = ["PT", "NZ"];
const threads = 20;

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });

const data: {
  country: string;
  average: number;
  median: number;
  population: number;
}[] = raw;

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

  data.push({
    country,
    average: Math.round(averageRank * 100) / 100,
    median: players[Math.floor(players.length / 2)].pp,
    population: metadata.total,
  });

  Deno.writeFileSync(
    "data.json",
    new TextEncoder().encode(JSON.stringify(data, undefined, 2))
  );

  console.table(data.sort((a, b) => b.average - a.average));

  await sleep(Date.now() - reset * 1000);
}
