/**
 * Topic hubs (/news/topic/<slug>/): running stories that cut across categories, such as every
 * Election 2026 story whether it sits in Planning or Holidays. Membership is computed, not
 * hand-tagged. A topic phrase in the title's head (before the first ":" or "?") makes a story a
 * core candidate; a phrase anywhere else (the rest of the title, keywords, slug) only a weak one,
 * since a title can name a topic in passing ("...five weeks after the midterms"). Every candidate
 * must also read like the rest: its mean similarity to the other candidates (lib/similarity.ts)
 * must reach CORE_RATIO (core) or WEAK_RATIO (weak) of the candidates' median. A dated topic
 * demotes a story whose title names only other years. A hub goes live only with
 * MIN_TOPIC_STORIES stories (no thin pages). Pure for testing.
 */
import { tokens } from "./similarity.ts";

export interface Topic {
  slug: string;
  name: string;
  /** Lede and meta description, 120 to 160 characters. */
  description: string;
  /** Phrases matched as whole words; any one is enough. */
  match: string[];
  /** The year a dated topic covers; a title naming only other years is at most a weak match. */
  year?: string;
  /** Pillar story shown as "Start here"; when missing or not a member, the most central core story. */
  start?: string;
  /** A daily puzzle hub: the page shows a date, number and link table of its daily pages (lib/puzzle-hub.ts). */
  puzzle?: boolean;
  /**
   * How the game works, shown once on the hub (#how-it-works). Daily pages link here in one line
   * instead of repeating the rules, so each day's page is written fresh (audit 13-PUZZLE-SIMILAR).
   */
  guide?: { heading: string; paras: string[] };
}

export const MIN_TOPIC_STORIES = 4;
/** Cohesion bars, relative to the candidates' median mean similarity. */
export const CORE_RATIO = 0.3;
export const WEAK_RATIO = 0.7;

export const TOPICS: Topic[] = [
  {
    slug: "election-2026",
    start: "2026-midterm-elections-whats-on-the-ballot-results-tracker",
    year: "2026",
    name: "Election 2026",
    description: "Every Fresh Calendars story on the Nov. 3, 2026, election: sample ballots, early voting, mail ballot deadlines, poll hours and when results come in.",
    match: ["election", "ballot", "early voting", "voter", "polls", "midterm", "propositions", "runoff"],
  },
  {
    slug: "thanksgiving-2026",
    start: "why-thanksgiving-2026-is-november-26",
    year: "2026",
    name: "Thanksgiving 2026",
    description: "Thanksgiving 2026 is Thursday, Nov. 26. Our stories on the date, school breaks, store hours, the parade and NFL games on TV, and when to thaw the turkey.",
    match: ["thanksgiving"],
  },
  {
    slug: "christmas-and-winter-holidays-2026",
    start: "winter-break-2026-school-districts-dates",
    year: "2026",
    name: "Christmas and Winter Holidays 2026",
    description: "Dates for the 2026 winter holidays: Hanukkah, Advent calendars, school winter breaks, holiday shipping deadlines, Christmas Eve store hours and NYC events.",
    match: ["christmas", "hanukkah", "advent", "winter break", "holiday shipping", "rockefeller"],
  },
  {
    slug: "halloween-2026",
    start: "halloween-2026-what-day-trick-or-treating-start",
    year: "2026",
    name: "Halloween 2026",
    description: "Halloween 2026 falls on a Saturday. Our stories on trick-or-treat times, sunset on Oct. 31, party ideas and the Day of the Dead dates that follow.",
    match: ["halloween", "trick or treat", "day of the dead"],
  },
  {
    slug: "holiday-shopping-2026",
    start: "black-friday-2026-store-hours-walmart-target-best-buy",
    year: "2026",
    name: "Holiday Shopping 2026",
    description: "Black Friday, Small Business Saturday and Cyber Monday 2026 dates, store hours, holiday closures, sales tax holidays and shipping deadlines in one place.",
    match: ["black friday", "cyber monday", "small business saturday", "store hours", "shipping deadline", "costco"],
  },
  {
    slug: "social-security-and-benefits",
    start: "social-security-cola-2027-3-6-percent-payment-dates",
    name: "Social Security and Benefits",
    description: "Social Security payment dates and the 2027 cost-of-living adjustment, plus the Medicare and Affordable Care Act open enrollment deadlines for 2026 and 2027.",
    match: ["social security", "medicare", "open enrollment", "cola"],
  },
  {
    slug: "test-dates-2026-27",
    start: "sat-act-test-dates-2026-27-registration-deadlines",
    name: "Test Dates 2026-27",
    description: "SAT, ACT, LSAT and MCAT test dates for 2026-27, with registration deadlines and score release dates taken from each testing organization's own calendar.",
    match: ["sat", "act test", "lsat", "mcat"],
  },
  // Daily puzzle hubs: one per game, so every day's page stays a click from the newest one (crawl
  // depth) and readers find past answers in one list.
  {
    slug: "wordle",
    puzzle: true,
    name: "Wordle Answers and Hints",
    description: "Every Wordle hints and answer page from Fresh Calendars, newest first: graded clues for each puzzle number and the answer checked against the puzzle data.",
    match: ["wordle"],
    guide: {
      heading: "How Wordle works",
      paras: [
        "You get six tries to find a five-letter word. After each guess, a green tile means the right letter in the right spot, yellow means the letter is in the word but in another spot, and gray means it is not in the word at all.",
        "A letter that appears twice is only marked twice if you guess it twice. Gray tiles matter too: every letter they rule out narrows the next guess.",
        "A new Wordle comes out at midnight in your local time. The puzzle data shows past answers coming back since Feb. 2, 2026, so an old answer can no longer be ruled out.",
      ],
    },
  },
  {
    slug: "nyt-connections",
    puzzle: true,
    name: "NYT Connections Answers and Hints",
    description: "Every New York Times Connections page, Sports Edition too: hints for each color group first, then the four groups and what links the words, newest first.",
    match: ["connections"],
    guide: {
      heading: "How Connections works",
      paras: [
        "Sort the 16 entries into four groups of four. You can make four mistakes before the game ends.",
        "The groups run from yellow, the most direct, to green, blue and purple, which leans hardest on wordplay such as hidden words, homophones or a missing word. A new puzzle comes out at midnight local time.",
      ],
    },
  },
  {
    slug: "nyt-strands",
    puzzle: true,
    name: "NYT Strands Answers and Hints",
    description: "Every New York Times Strands page, newest first: the clue explained, spangram and theme-word hints, then all the answers from the official puzzle data.",
    match: ["strands"],
    guide: {
      heading: "How Strands works",
      paras: [
        "The board is six letters wide and eight tall. Theme words are made by linking letters that touch, up, down, sideways or diagonally, and every letter is used exactly once.",
        "One special answer, the spangram, names the theme and stretches from one side of the board to the opposite side. Find three words that are not on the theme and you earn a hint that highlights the letters of a theme word.",
      ],
    },
  },
  {
    slug: "nyt-spelling-bee",
    puzzle: true,
    name: "NYT Spelling Bee Answers and Hints",
    description: "Every New York Times Spelling Bee page, newest first: letters, hint grid, two-letter list and Genius score, then the pangrams and full word list.",
    match: ["spelling bee"],
    guide: {
      heading: "How Spelling Bee works",
      paras: [
        "You get seven letters in a honeycomb. Each word must be at least four letters long and must use the yellow center letter, and letters can repeat.",
        "A four-letter word is worth 1 point and a longer word is worth one point per letter. A pangram uses all seven letters and earns 7 extra points. Genius is 70% of the day's total, so the number changes every day.",
      ],
    },
  },
  {
    slug: "nyt-pips",
    puzzle: true,
    name: "NYT Pips Answers and Hints",
    description: "Every New York Times Pips page, newest first: hints for the Easy, Medium and Hard boards, then domino placements checked against every region rule.",
    match: ["pips"],
    guide: {
      heading: "How Pips works",
      paras: [
        "You place every domino on the board so that each colored region meets its condition. A number means the pips in the region add up to it, = means every half shows the same value, ≠ means all are different, and > or < set a total above or below a number. A region with no condition takes anything.",
        "There are three boards a day: Easy, Medium and Hard. Our pages count rows from the top and columns from the left, so R2C5 is the second row, fifth column.",
      ],
    },
  },
  {
    slug: "nyt-letter-boxed",
    puzzle: true,
    name: "NYT Letter Boxed Answers and Hints",
    description: "Every New York Times Letter Boxed page, newest first: the four sides and par, starting hints and warm-up words, then the Times' own solution.",
    match: ["letter boxed"],
    guide: {
      heading: "How Letter Boxed works",
      paras: [
        "You get twelve letters, three on each side of a square. Make words of at least three letters by connecting letters, and never use two letters from the same side one after the other.",
        "Each new word must start with the last letter of the word before it. Every letter has to be used at least once, and the goal is to finish within par, the number of words the day allows.",
      ],
    },
  },
  {
    slug: "nyt-mini-crossword",
    puzzle: true,
    name: "NYT Mini Crossword Answers",
    description: "Every New York Times Mini Crossword page, newest first: a hint for each across and down clue, then the full grid from the Mini's official puzzle data.",
    match: ["mini crossword"],
    guide: {
      heading: "How the Mini works",
      paras: [
        "The Mini is a small daily crossword from The New York Times, usually five squares by five. Across and down answers cross, so each one you fill gives letters to the others.",
        "The next day's Mini is reported to go live at 10 p.m. Eastern Time (ET) the evening before, and at 6 p.m. ET on Saturday for Sunday's puzzle.",
      ],
    },
  },
  {
    slug: "nyt-midi-crossword",
    puzzle: true,
    name: "NYT Midi Crossword Answers",
    description: "Every New York Times Midi Crossword page, newest first: the day's theme, a hint for each across and down clue, then the full grid from official data.",
    match: ["midi crossword"],
    guide: {
      heading: "How the Midi works",
      paras: [
        "The Midi is a daily themed crossword from The New York Times, larger than the Mini: a grid of about nine or ten squares a side with roughly 30 to 36 clues.",
        "Each Midi has a title that hints at the day's theme, and the theme answers share that idea. Across and down answers cross, so each one you fill gives letters to the others.",
      ],
    },
  },
  {
    slug: "nyt-crossword",
    puzzle: true,
    name: "NYT Crossword Answers",
    description: "Every New York Times daily Crossword page, newest first: a hint for each across and down clue, then the full solved grid from the puzzle's official data.",
    match: ["nyt crossword answers"],
    guide: {
      heading: "How the NYT Crossword works",
      paras: [
        "The New York Times Crossword is the paper's main daily puzzle, edited by Will Shortz. Weekday grids are 15 squares by 15; the puzzle data for each day gives its size, its constructor and every clue.",
        "Every white square belongs to one Across answer and one Down answer, so each answer you fill hands letters to the entries that cross it. A clue ending in a question mark signals wordplay, and a clue in quotation marks is a spoken phrase.",
      ],
    },
  },
  {
    slug: "contexto",
    puzzle: true,
    name: "Contexto Answers and Hints",
    description: "Every Contexto page, newest first: the game number, close words ranked by the game itself and hints that narrow the meaning, then the secret word.",
    match: ["contexto"],
    guide: {
      heading: "How Contexto works",
      paras: [
        "Contexto ranks every guess by how close its meaning is to the secret word, which sits at number 1. Spelling does not matter, only how often words are used together.",
        "A guess near the top shows green, a middling one yellow and a distant one red. Steer each new guess with your best-ranked words.",
      ],
    },
  },
  {
    slug: "quordle",
    puzzle: true,
    name: "Quordle Answers and Hints",
    description: "Every Quordle page, newest first: a clue for each of the four five-letter words in the daily puzzle, then all four answers in a marked spoiler section.",
    match: ["quordle"],
    guide: {
      heading: "How Quordle works",
      paras: [
        "You have nine guesses to solve four five-letter words. Every guess is entered on all four boards at once.",
        "The tiles color like Wordle's: green for the right letter in the right spot, yellow for a letter in the wrong spot, gray for a letter that is not in that word.",
      ],
    },
  },
  {
    slug: "waffle",
    puzzle: true,
    name: "Waffle Answers and Hints",
    description: "Every Waffle page, newest first: a clue for each of the six words in the daily grid, then the solved grid and a route that finishes in the minimum swaps.",
    match: ["waffle"],
    guide: {
      heading: "How Waffle works",
      paras: [
        "The board is a five-by-five grid with four holes, so 21 letters are in play. Three words run across and three run down, and you swap any two letters to put them in place.",
        "Green means the letter is in the right place, yellow means it belongs in that row or column but elsewhere, and gray means it is not in that row or column. A corner letter can be yellow for either word that meets there.",
        "You have 15 swaps and earn a star for each one left. The game says every Waffle can be solved in 10 swaps.",
      ],
    },
  },
  {
    slug: "linkedin-games",
    puzzle: true,
    name: "LinkedIn Games Answers",
    description: "Every LinkedIn games page, newest first: hints and answers for Queens, Tango, Zip, Pinpoint, Crossclimb and Mini Sudoku, checked before they are posted.",
    match: ["linkedin games", "linkedin"],
  },
];

export interface TopicCandidate {
  id: string;
  title: string;
  keywords: string[];
}

const has = (text: string, phrase: string) => ` ${tokens(text).join(" ")} `.includes(` ${tokens(phrase).join(" ")} `);

/** "core" for a phrase in the title's head, "weak" for one only elsewhere, else null. */
export function matchTier(t: Topic, a: TopicCandidate): "core" | "weak" | null {
  const head = a.title.split(/[:?]/)[0]!;
  const inHead = t.match.some((m) => has(head, m));
  if (!inHead && !t.match.some((m) => has([a.title, ...a.keywords, a.id.replaceAll("-", " ")].join(" "), m))) return null;
  const years: string[] = a.title.match(/\b20\d\d\b/g) ?? [];
  const otherYearOnly = t.year !== undefined && years.length > 0 && !years.includes(t.year);
  return inHead && !otherYearOnly ? "core" : "weak";
}

export function inTopic(t: Topic, a: TopicCandidate): boolean {
  return matchTier(t, a) !== null;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : 0;
};

/**
 * Live topics with their members (input order kept, so pass stories newest first). Without a
 * similarity function there is no cohesion check and only core matches count.
 */
export function topicMembers<T extends TopicCandidate>(
  stories: T[],
  sim?: (a: string, b: string) => number,
  topics: Topic[] = TOPICS,
): { topic: Topic; items: T[] }[] {
  return topics
    .map((topic) => {
      const tiers = new Map(stories.map((a) => [a.id, matchTier(topic, a)]));
      const cands = stories.filter((a) => tiers.get(a.id));
      if (!sim) return { topic, items: cands.filter((a) => tiers.get(a.id) === "core") };
      const cohesion = new Map(cands.map((a) => {
        const others = cands.filter((c) => c.id !== a.id);
        return [a.id, others.length ? others.reduce((sum, c) => sum + sim(a.id, c.id), 0) / others.length : 0];
      }));
      const mid = median([...cohesion.values()]);
      const items = cands.filter((a) => cohesion.get(a.id)! >= (tiers.get(a.id) === "core" ? CORE_RATIO : WEAK_RATIO) * mid);
      return { topic, items };
    })
    .filter((t) => t.items.length >= MIN_TOPIC_STORIES);
}

/** "Start here" story: the topic's pillar if it is a member, else the most central core member. */
export function startId<T extends TopicCandidate>(t: Topic, items: T[], central: (ids: string[]) => string | undefined): string | undefined {
  if (t.start && items.some((a) => a.id === t.start)) return t.start;
  const core = items.filter((a) => matchTier(t, a) === "core").map((a) => a.id);
  return central(core.length ? core : items.map((a) => a.id));
}

export const topicPath = (slug: string) => `/news/topic/${slug}/`;
