export function splitDiscordMessage(text: string, limit = 1900): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= limit) return [clean];

  const chunks: string[] = [];
  let remaining = clean;

  while (remaining.length > limit) {
    const window = remaining.slice(0, limit + 1);
    const cuts = [
      window.lastIndexOf("\n\n"),
      window.lastIndexOf("\n"),
      window.lastIndexOf(". "),
      window.lastIndexOf(" "),
    ];

    let cut = Math.max(...cuts);
    if (cut < Math.floor(limit * 0.55)) cut = limit;
    else if (window.slice(cut, cut + 2) === ". ") cut += 1;

    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

export function normalizeContent(text: string, botId: string): string {
  return text
    .replace(new RegExp(`<@!?${botId}>`, "g"), "Gemini")
    .trim()
    .slice(0, 1800);
}

export function isMeaningfulForNaturalMode(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 8) return false;
  if (/^(kk+|rs+|haha+|sim|nao|não|ok|blz|vlw|bom|boa|real|f|ata)[.!?\s]*$/i.test(clean)) return false;
  if (/^https?:\/\/\S+$/i.test(clean)) return false;
  return true;
}
