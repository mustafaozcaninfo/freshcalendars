/**
 * Measurement for /news/ (every page, including policy and 404 pages): Google Analytics 4,
 * Microsoft Clarity and the first-party page-view beacon. The snippets live in site-chrome so the
 * calendar pages load the same ones; they ride in the existing nav inline script, so pages keep
 * ≤2 inline scripts and no <script src> in the HTML (audit 02-NO-JS-CONTENT, 01-GA-LOAD).
 * NEWS_GA=0 or NEWS_PV=0 at build time turns one off.
 */
export { GA_ID, CLARITY_ID, GA_ORIGINS, GA_JS, PV_JS } from "@freshcalendars/site-chrome";
export const GA_ENABLED = process.env.NEWS_GA !== "0";
export const PV_ENABLED = process.env.NEWS_PV !== "0";
