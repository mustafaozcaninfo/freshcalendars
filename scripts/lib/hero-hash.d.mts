export interface HeroRecord { kind: "scene" | "poster" | "photo"; scene?: string; render?: string }
export interface StoryHero { slug: string; file: string; published: string; record: HeroRecord | null }
export const SAME_PICTURE: number;
export const UNIQUE_SINCE: string;
export function heroHash(file: string): Promise<string>;
export function distance(a: string, b: string): number;
export function heroRecord(heroFile: string): HeroRecord | null;
export function storyHeroes(articlesDir?: string): StoryHero[];
export function duplicateHeroes(stories?: StoryHero[]): Promise<{ a: StoryHero; b: StoryHero; d: number }[]>;
export function heroProblems(slug: string, stories?: StoryHero[]): Promise<string[]>;
