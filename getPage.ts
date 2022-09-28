import { components as ScoreSaber } from "./types/scoresaber.ts";

export default async function getPage(page: number, country = "au") {
  const response = await fetch(
    `https://scoresaber.com/api/players?countries=${encodeURIComponent(
      country
    )}&page=${page}`
  );

  if (response.status !== 200) throw response;
  const data =
    (await response.json()) as ScoreSaber["schemas"]["PlayerCollection"];
  return {
    ...data,
    remaining: response.headers.get("x-ratelimit-remaining"),
    reset: response.headers.get("x-ratelimit-reset"),
  };
}
