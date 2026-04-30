// Watchlist matching: normalize → tokenize → AND-match with optional
// single-edit typo tolerance for tokens of length >= 4.

const STOPWORDS = new Set([
  "a", "an", "and", "or", "the", "of", "for", "to", "in", "on", "at", "with",
  "by", "is", "it", "this", "that", "be",
]);

function stem(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3);
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export function tokenize(input: string): string[] {
  const normalized = input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  if (!normalized) return [];
  const tokens: string[] = [];
  for (const raw of normalized.split(/\s+/)) {
    if (!raw || STOPWORDS.has(raw)) continue;
    tokens.push(stem(raw));
  }
  return tokens;
}

// Levenshtein distance with early exit at maxDistance.
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return false;
    [prev, curr] = [curr, prev];
  }
  return prev[n] <= max;
}

function tokenMatches(queryToken: string, haystack: Set<string>): boolean {
  if (haystack.has(queryToken)) return true;
  if (queryToken.length < 4) return false;
  for (const t of haystack) {
    if (Math.abs(t.length - queryToken.length) > 1) continue;
    if (withinEditDistance(queryToken, t, 1)) return true;
  }
  return false;
}

export function matchesQuery(haystack: string, query: string): boolean {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return false;
  const haystackTokens = new Set(tokenize(haystack));
  if (haystackTokens.size === 0) return false;
  return queryTokens.every((t) => tokenMatches(t, haystackTokens));
}
