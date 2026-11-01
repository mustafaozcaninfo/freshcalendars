/**
 * The 08-ABBREV rule, shared by the SEO audit (built HTML) and the fast pre-push check on
 * Markdown (scripts/news-abbrev-check.mjs), so both flag exactly the same words.
 */

// Abbreviations every US reader knows are exempt.
export const COMMON = new Set(["US", "AXS", "U.S.", "UK", "EU", "ET", "AM", "PM", "TV", "NBC", "ID", "UTC", "NYSE", "SAT", "ACT", "EDM", "AARP", "AAA", "DST", "EST", "EDT", "CST", "CDT", "MST", "MDT", "PST", "PDT", "AKST", "AKDT", "GMT", "BST", "CET", "CEST", "COLA", "SSI", "II", "III", "DC", "NASA", "IRS", "PDF", "PNG",
  // Proper names written in capitals, not abbreviations.
  "TIME", "GOV", "NORC", "LEGO", "PEAK", "IKEA", "H-E-B", "CVS", "UPS", "FOX", "ESPN", "ESPNU", "CBS",
  // Album titles and an artist name styled in capitals (Premios Billboard winners).
  "DINASTIA", "LUX", "MAG",
  // Traffic-analytics company name and the REAL ID program name, proper nouns in capitals.
  "INRIX", "REAL",
  // Restaurant chain name with a capitalized word (Mission BBQ, Veterans Day deals).
  "BBQ",
  // Golf tournament sponsor names written in capitals (TOTO Japan Classic, The ANNIKA, The RSM Classic, CME Group Tour Championship).
  "TOTO", "ANNIKA", "RSM", "CME",
  // Country name and brand names written in capitals (USA Network, IMAX theaters).
  "USA", "IMAX",
  // Words quoted as printed in capitals ("10-22-38 ASTORIA", the first xerographic copy).
  "ASTORIA",
  // Phone mnemonics (1-800-MEDICARE, 1-800-QUIT-NOW).
  "MEDICARE", "QUIT-NOW",
  // Text-message keywords as the agencies print them (SmokefreeTXT: QUIT, HELP; CDC: QUITNOW).
  "QUIT", "QUITNOW", "HELP",
  // Spreadsheet function names.
  "WEEKNUM", "ISOWEEKNUM", "NYC", "USPS",
  // IRS form suffixes (Form 1099-NEC, 1099-MISC).
  "NEC", "MISC",
  // Postal codes, as familiar as ID.
  "ZIP",
  // Show titles styled in capitals (Hulu November 2026 list: "MAO", "LOL Live with Comedian CP").
  "MAO", "LOL",
  // Arena names built on company names written in capitals (PPG Paints Arena, SAP Center).
  "PPG", "SAP", "UBS",
  // Broadcast call letters and a transit route name styled in capitals (WISN 12 News, WUWM, MCTS CONNECT 1).
  "WISN", "WUWM", "CONNECT",
  // More call letters (KWQC, WDIV, KTTC) and a promo code as the company prints it (Lime HEADCOUNT).
  "KWQC", "WDIV", "KTTC", "HEADCOUNT",
  // Leagues and networks as well known as NBC, CBS and ESPN; Hawaii time beside AKST.
  "NFL", "NBA", "NHL", "MLB", "ABC", "BBC", "CNN", "PBS", "HBO", "NPR", "HST", "HDT"]);

/** Capitalized abbreviations in `text` that are neither exempt nor written as "Full Name (ABBR)" at or before first use. */
export function unexpandedAbbrevs(text) {
  const missing = [];
  const seen = new Set();
  for (const m of text.matchAll(/\b([A-Z][A-Z-]{1,}[A-Z])\b/g)) {
    const a = m[1]; if (seen.has(a) || COMMON.has(a)) continue; seen.add(a);
    // Date-format patterns such as YYDDD or YYYY-DDD are not abbreviations.
    if (/^[YMD-]+$/.test(a)) continue;
    // A word spelled out letter by letter ("C-H-E-E-S-E", as quoted from a crossword clue) is not an abbreviation.
    if (/^(?:[A-Z]-){2,}[A-Z]$/.test(a)) continue;
    const at = m.index; const around = text.slice(Math.max(0, at - 120), at + a.length + 2);
    if (!around.includes(`(${a})`) && !new RegExp(`\\(${a}\\)`).test(text.slice(0, at + a.length + 2))) missing.push(a);
  }
  return missing;
}
