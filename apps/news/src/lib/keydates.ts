/**
 * "Coming up" dates on the news home. Every entry points at the published story that reports
 * it, and every date is taken from that story (the build fails if the story is missing).
 * Past dates drop off automatically on the next build; the cron rebuild runs every 15 minutes.
 */
export interface KeyDate {
  /** Calendar date in Eastern Time, YYYY-MM-DD. */
  date: string;
  label: string;
  /** Article slug that covers it. */
  slug: string;
}

export const KEY_DATES: KeyDate[] = [
  { date: "2026-12-09", label: "Bank of Canada rate announcement, 9:45 a.m. ET", slug: "bank-of-canada-rate-hike-october-28-2026-next-dates-2027" },
  { date: "2026-11-01", label: "US clocks fall back; Mexico City moves to Chicago's time", slug: "mexico-time-difference-after-november-1-2026-us-clocks-fall-back" },
  { date: "2026-10-28", label: "National First Responders Day", slug: "national-first-responders-day-2026-october-28" },
  { date: "2026-11-01", label: "Clocks stay put in BC, Alberta, Saskatchewan, Manitoba, Yukon and NWT", slug: "canada-clocks-fall-back-november-1-2026-which-provinces-no-time-change" },
  { date: "2026-11-07", label: "Crescent Moon about 1° from Venus before sunrise", slug: "planets-visible-november-2026-night-sky-calendar-moon-venus-uranus-opposition" },
  { date: "2026-11-16", label: "Mars and Jupiter 1.2° apart before dawn", slug: "planets-visible-november-2026-night-sky-calendar-moon-venus-uranus-opposition" },
  { date: "2026-11-25", label: "Uranus at opposition", slug: "planets-visible-november-2026-night-sky-calendar-moon-venus-uranus-opposition" },
  { date: "2026-10-29", label: "National Cat Day", slug: "national-cat-day-2026-thursday-october-29" },
  { date: "2026-11-05", label: "Birmingham Frankfurt Christmas Market opens", slug: "manchester-birmingham-christmas-markets-2026-dates-opening-times" },
  { date: "2026-11-06", label: "Manchester Christmas Markets open", slug: "manchester-birmingham-christmas-markets-2026-dates-opening-times" },
  { date: "2026-10-29", label: "Sam Fender St. James' Park presale, 9:30 a.m. GMT", slug: "sam-fender-tickets-2027-stadium-tour-presale-general-sale-time" },
  { date: "2026-10-30", label: "Sam Fender 2027 stadium tour general sale, 9:30 a.m. GMT (5:30 a.m. ET)", slug: "sam-fender-tickets-2027-stadium-tour-presale-general-sale-time" },
  { date: "2026-11-15", label: "Nitto ATP Finals begin, Inalpi Arena, Turin", slug: "atp-finals-2026-turin-dates-schedule-time-zones-tv-qualified-players" },
  { date: "2026-11-22", label: "Nitto ATP Finals final day, Turin", slug: "atp-finals-2026-turin-dates-schedule-time-zones-tv-qualified-players" },
  { date: "2026-11-25", label: "Ofgem announces energy price cap for Jan. to Mar. 2027", slug: "energy-price-cap-january-2027-announcement-date-25-november-standing-charges" },
  { date: "2027-01-01", label: "New Ofgem energy price cap period begins", slug: "energy-price-cap-january-2027-announcement-date-25-november-standing-charges" },
  { date: "2026-11-27", label: "Black Friday in the UK", slug: "black-friday-2026-uk-date-27-november-amazon-uk-sale-dates" },
  { date: "2026-10-28", label: "Winnipeg and Manitoba municipal elections", slug: "winnipeg-election-2026-october-28-voting-hours-id-what-to-know" },
  { date: "2026-11-06", label: "Nations Championship November series begins", slug: "nations-championship-rugby-november-2026-fixtures-kick-off-times-uk-us" },
  { date: "2026-11-21", label: "England v New Zealand, 2:10 p.m. GMT", slug: "nations-championship-rugby-november-2026-fixtures-kick-off-times-uk-us" },
  { date: "2026-11-29", label: "Nations Championship final at Twickenham", slug: "nations-championship-rugby-november-2026-fixtures-kick-off-times-uk-us" },
  { date: "2026-10-27", label: "Free entry at national parks (U.S. residents)", slug: "national-parks-free-days-october-27-veterans-day-2026" },
  { date: "2026-11-01", label: "NYC Marathon: Wave 1 starts 9:10 a.m. ET", slug: "nyc-marathon-2026-start-times-road-closures-where-to-watch" },
  { date: "2026-11-11", label: "Last 2026 fee-free day at national parks", slug: "national-parks-free-days-october-27-veterans-day-2026" },
  { date: "2026-11-24", label: "Thanksgiving travel period begins (2025 pattern)", slug: "thanksgiving-travel-2026-best-days-to-fly-and-drive" },
  { date: "2026-10-28", label: "Social Security payday: birthdays 21st-31st", slug: "social-security-payment-schedule-october-2026-who-gets-paid-today" },
  { date: "2026-11-10", label: "Social Security paid a day early (Veterans Day)", slug: "social-security-payment-schedule-october-2026-who-gets-paid-today" },
  { date: "2026-10-25", label: "Clocks go back in the UK and Europe", slug: "uk-europe-clocks-go-back-october-25-2026-time-difference" },
  { date: "2026-10-31", label: "Halloween falls on a Saturday", slug: "halloween-2026-saturday-sunset-trick-or-treat-times" },
  { date: "2026-11-01", label: "Daylight saving time ends in the U.S.", slug: "daylight-saving-time-ends-november-1-2026" },
  { date: "2026-11-01", label: "ACA open enrollment for 2027 begins", slug: "aca-open-enrollment-2027-dates-november-1-january-15" },
  { date: "2026-11-02", label: "Día de los Muertos", slug: "day-of-the-dead-2026-dia-de-los-muertos-dates" },
  { date: "2026-10-23", label: "Texas mail ballot applications due", slug: "texas-election-calendar-2026-early-voting-dates-deadlines" },
  { date: "2026-10-30", label: "Last day of early voting in Texas", slug: "texas-election-calendar-2026-early-voting-dates-deadlines" },
  { date: "2026-11-03", label: "Election Day", slug: "sample-ballot-by-zip-code-2026-texas-ballot" },
  { date: "2026-11-04", label: "Southern Taurid meteor shower peaks", slug: "november-2026-meteor-showers-taurids-leonids" },
  { date: "2026-11-06", label: "Dhanteras, first day of Diwali", slug: "diwali-2026-date-lakshmi-puja-time-usa" },
  { date: "2026-11-08", label: "Diwali and Lakshmi Puja", slug: "diwali-2026-date-lakshmi-puja-time-usa" },
  { date: "2026-11-11", label: "Veterans Day", slug: "veterans-day-2026-wednesday-november-11" },
  { date: "2026-10-29", label: "Wisconsin and Maine: absentee ballot requests due", slug: "wisconsin-ballot-2026-governor-candidates-constitutional-amendments" },
  { date: "2026-11-05", label: "Bonfire Night in the UK; fireworks allowed until midnight", slug: "bonfire-night-2026-thursday-november-5-fireworks-rules" },
  { date: "2026-11-08", label: "Remembrance Sunday in the UK", slug: "remembrance-day-2026-canada-statutory-holiday-remembrance-sunday-uk" },
  { date: "2026-11-09", label: "Federal Benefits Open Season begins", slug: "federal-benefits-open-season-2026-dates-fehb-premiums" },
  { date: "2026-11-11", label: "Remembrance Day in Canada: two minutes of silence at 11 a.m.", slug: "remembrance-day-2026-canada-statutory-holiday-remembrance-sunday-uk" },
  { date: "2026-11-01", label: "All Saints Day, a U.S. holy day of obligation", slug: "all-saints-day-2026-holy-day-of-obligation-all-souls-day" },
  { date: "2026-10-26", label: "Ballon d'Or ceremony, London: 20:00 GMT (4 p.m. ET)", slug: "ballon-dor-2026-date-time-by-time-zone-nominees-london" },
  { date: "2026-10-27", label: "National Black Cat Day", slug: "national-black-cat-day-2026-october-27" },
  { date: "2026-12-21", label: "Winter Fuel Payment: opting out for 2027 to 2028 possible from this date", slug: "winter-fuel-payment-2026-dates-amounts-35000-threshold" },
  { date: "2027-03-31", label: "Winter Fuel Payment: deadline to claim for winter 2026 to 2027", slug: "winter-fuel-payment-2026-dates-amounts-35000-threshold" },
  { date: "2026-10-28", label: "UK Budget 2026 and OBR forecast", slug: "uk-budget-2026-date-wednesday-28-october-what-time" },
  { date: "2026-10-30", label: "Nevada Day: state offices closed, last day of early voting", slug: "nevada-day-2026-friday-october-30-whats-closed-early-voting" },
  { date: "2026-10-31", label: "Nevada Day Parade, Carson City", slug: "nevada-day-2026-friday-october-30-whats-closed-early-voting" },
  { date: "2026-11-09", label: "New Moon: 2:02 a.m. EST", slug: "moon-phase-tonight-october-27-november-2026-moon-calendar" },
  { date: "2026-11-17", label: "First Quarter Moon: 6:48 a.m. EST", slug: "moon-phase-tonight-october-27-november-2026-moon-calendar" },
  { date: "2026-11-23", label: "Austin ISD fall break (Nov. 23-27)", slug: "austin-isd-calendar-2026-27-holidays-breaks" },
  { date: "2026-12-21", label: "Charlotte-Mecklenburg Schools (CMS) winter break begins (through Jan. 1)", slug: "charlotte-mecklenburg-schools-calendar-2026-27-breaks" },
  { date: "2027-03-29", label: "Wake County (WCPSS) traditional-calendar spring break (through Apr. 2)", slug: "wake-county-public-schools-calendar-2026-27-traditional" },
  { date: "2026-11-05", label: "Bank of England interest rate decision (MPC)", slug: "bank-of-england-interest-rate-dates-2027-mpc-5-november" },
  { date: "2026-12-09", label: "Federal Reserve FOMC decision, 2 p.m. ET", slug: "fomc-meeting-dates-2027-fed-schedule-december-2026" },
  { date: "2026-12-17", label: "Bank of England interest rate decision (MPC)", slug: "bank-of-england-interest-rate-dates-2027-mpc-5-november" },
  { date: "2026-12-21", label: "Fairfax County schools (FCPS) winter break begins (through Jan. 3)", slug: "fairfax-county-public-schools-calendar-2026-27-breaks" },
  { date: "2026-10-31", label: "UK Self Assessment paper tax return deadline (11:59pm)", slug: "self-assessment-deadline-31-january-2027-tax-return-penalties" },
  { date: "2027-01-31", label: "UK Self Assessment online return and payment deadline (11:59pm)", slug: "self-assessment-deadline-31-january-2027-tax-return-penalties" },
  { date: "2026-12-21", label: "Dallas ISD winter break begins (through Jan. 4)", slug: "dallas-isd-calendar-2026-27-holidays-breaks" },
  { date: "2026-12-23", label: "Philadelphia schools winter recess begins (through Dec. 31)", slug: "philadelphia-school-district-calendar-2026-27-holidays" },
  { date: "2026-10-30", label: "Nevada Day observed: no school in Clark County (CCSD)", slug: "clark-county-school-district-calendar-2026-27-breaks" },
  { date: "2027-02-19", label: "MLB Spring Training begins", slug: "mlb-opening-day-2027-date-march-25-spring-training-all-star" },
  { date: "2027-02-21", label: "NBA All-Star Game in Phoenix (NBC)", slug: "nba-all-star-2027-date-phoenix-rising-stars-schedule" },
  { date: "2027-03-25", label: "MLB Opening Day (Opening Night is Mar. 24)", slug: "mlb-opening-day-2027-date-march-25-spring-training-all-star" },
  { date: "2026-12-21", label: "Houston ISD winter recess begins (through Dec. 31)", slug: "houston-isd-calendar-2026-27-holidays-breaks" },
  { date: "2026-12-21", label: "Gwinnett County schools winter break begins (through Jan. 1)", slug: "gwinnett-county-schools-calendar-2026-27-breaks" },
  { date: "2026-12-31", label: "NHL Winter Classic: Avalanche at Mammoth, 4 p.m. MT (6 p.m. ET)", slug: "nhl-winter-classic-2027-date-time-avalanche-mammoth-salt-lake-city" },
  { date: "2026-11-01", label: "UK Cold Weather Payment scheme opens (£25 per 7-day freeze)", slug: "cold-weather-payment-2026-27-dates-25-pounds-who-gets-it" },
  { date: "2026-12-29", label: "Rose Parade Bandfest opens in Pasadena", slug: "rose-parade-2027-date-start-time-by-time-zone-route-floatfest" },
  { date: "2027-01-01", label: "138th Rose Parade: 8 a.m. PT (11 a.m. ET)", slug: "rose-parade-2027-date-start-time-by-time-zone-route-floatfest" },
  { date: "2027-03-08", label: "Spring break 2027 starts in Houston ISD", slug: "spring-break-2027-dates-school-districts" },
  { date: "2027-03-22", label: "Spring break week for Chicago, Broward, Palm Beach, Fairfax, Philadelphia", slug: "spring-break-2027-dates-school-districts" },
  { date: "2026-11-11", label: "Singles Day (11.11) sales", slug: "singles-day-2026-november-11-11-11-sale-dates" },
  { date: "2026-10-31", label: "UFC Fight Night: Moicano vs. Nolan, main card 8 p.m. ET", slug: "ufc-fight-night-moicano-vs-nolan-halloween-start-time-how-to-watch" },
  { date: "2026-11-01", label: "Mexico City Grand Prix: race 3 p.m. ET", slug: "mexico-city-grand-prix-2026-schedule-race-time-by-time-zone" },
  { date: "2026-10-28", label: "National Christmas Tree ticket lottery opens, 10 a.m. ET", slug: "national-christmas-tree-lighting-2026-ticket-lottery-october-28" },
  { date: "2026-11-04", label: "National Christmas Tree lottery closes, 3 p.m. ET", slug: "national-christmas-tree-lighting-2026-ticket-lottery-october-28" },
  { date: "2026-11-29", label: "First Sunday of Advent", slug: "when-does-advent-start-2026-november-29-advent-wreath-candles" },
  { date: "2026-12-03", label: "National Christmas Tree lighting on the Ellipse", slug: "national-christmas-tree-lighting-2026-ticket-lottery-october-28" },
  { date: "2026-11-10", label: "NFL trade deadline, 4 p.m. ET (1 p.m. PT)", slug: "nfl-trade-deadline-2026-november-10-time-et" },
  { date: "2026-11-14", label: "Lord Mayor's Show, City of London, 11am", slug: "lord-mayors-show-2026-date-time-route-november-14" },
  { date: "2026-12-25", label: "Christmas Day NBA and NFL games, from 12 p.m. ET", slug: "christmas-day-2026-games-nba-nfl-schedule-times-tv" },
  { date: "2026-11-05", label: "PSAT scores for schools that submitted by Oct. 23", slug: "psat-scores-2026-release-date-november-5-november-12" },
  { date: "2026-11-12", label: "PSAT scores for schools that submitted by Oct. 30", slug: "psat-scores-2026-release-date-november-5-november-12" },
  { date: "2026-12-09", label: "Canada Post deadline for letters to Santa", slug: "canada-post-holiday-shipping-deadlines-2026-christmas" },
  { date: "2026-12-12", label: "127th Army-Navy Game, 3 p.m. ET on CBS", slug: "army-navy-game-2026-date-kickoff-time-metlife-stadium-tv" },
  { date: "2026-11-08", label: "São Paulo Grand Prix, 12 p.m. ET", slug: "sao-paulo-grand-prix-2026-schedule-race-time-by-time-zone" },
  { date: "2026-11-11", label: "Rings of Power Season 3 premieres on Prime Video", slug: "new-on-prime-video-november-2026-rings-of-power-season-3" },
  { date: "2026-11-15", label: "113th Grey Cup in Calgary, 6 p.m. ET", slug: "grey-cup-2026-date-kickoff-time-calgary-cfl-playoffs" },
  { date: "2026-11-12", label: "27th Latin Grammy Awards", slug: "latin-grammys-2026-date-las-vegas-how-to-watch" },
  { date: "2026-11-16", label: "Grammy nominations for the 69th Grammy Awards", slug: "grammy-nominations-2027-date-69th-grammys-february-7" },
  { date: "2026-11-18", label: "CMA Awards, 8 p.m. ET on ABC", slug: "cma-awards-2026-date-time-channel-host-nominees" },
  { date: "2027-02-07", label: "69th Annual Grammy Awards", slug: "grammy-nominations-2027-date-69th-grammys-february-7" },
  { date: "2026-11-20", label: "Percy Jackson Season 3 premieres on Disney+", slug: "new-on-disney-plus-november-2026-release-dates" },
  { date: "2026-12-28", label: "UK Boxing Day bank holiday (substitute day)", slug: "uk-christmas-bank-holidays-2026-boxing-day-substitute-december-28" },
  { date: "2026-11-13", label: "AP exam order deadline for full-year courses", slug: "ap-exam-schedule-2027-dates-times-registration-deadline" },
  { date: "2027-02-06", label: "Annular solar eclipse (South America, Africa)", slug: "eclipses-2027-dates-times-total-solar-eclipse-august-2" },
  { date: "2027-05-03", label: "AP Exams begin (through May 14)", slug: "ap-exam-schedule-2027-dates-times-registration-deadline" },
  { date: "2027-08-02", label: "Total solar eclipse (Spain, North Africa, Middle East)", slug: "eclipses-2027-dates-times-total-solar-eclipse-august-2" },
  { date: "2026-12-01", label: "GivingTuesday", slug: "giving-tuesday-2026-december-1-tax-deduction-charity-check" },
  { date: "2026-12-26", label: "Kwanzaa begins (through Jan. 1)", slug: "kwanzaa-2026-dates-seven-principles-calendar-printable" },
  { date: "2027-01-18", label: "Martin Luther King Jr. Day, federal holiday", slug: "martin-luther-king-jr-day-2027-january-18-whats-closed" },
  { date: "2026-12-14", label: "Federal Benefits Open Season ends", slug: "federal-benefits-open-season-2026-dates-fehb-premiums" },
  { date: "2026-11-16", label: "Leonid meteor shower peaks", slug: "november-2026-meteor-showers-taurids-leonids" },
  { date: "2026-11-18", label: "Opt in to read your COLA notice online", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2026-11-02", label: "No school in Chicago (Nov. 2-3)", slug: "chicago-public-schools-calendar-2026-27-breaks" },
  { date: "2026-11-03", label: "NYC schools remote for Election Day", slug: "nyc-public-schools-calendar-2026-27-breaks-holidays" },
  { date: "2026-11-26", label: "Thanksgiving", slug: "why-thanksgiving-2026-is-november-26" },
  { date: "2026-11-27", label: "Native American Heritage Day", slug: "native-american-heritage-day-2026-friday-november-27-heritage-month" },
  { date: "2026-12-26", label: "Boxing Day in Canada (Saturday)", slug: "boxing-day-2026-canada-saturday-december-26-day-off-monday-december-28" },
  { date: "2026-12-28", label: "Canada Post closed for Boxing Day", slug: "boxing-day-2026-canada-saturday-december-26-day-off-monday-december-28" },
  { date: "2026-11-02", label: "Last day to add October PS Plus Monthly Games", slug: "playstation-plus-november-2026-games-dead-island-2-tomb-raider-monster-train-2" },
  { date: "2026-11-03", label: "November PS Plus Monthly Games playable", slug: "playstation-plus-november-2026-games-dead-island-2-tomb-raider-monster-train-2" },
  { date: "2026-11-30", label: "Last day for November PS Plus Monthly Games", slug: "playstation-plus-november-2026-games-dead-island-2-tomb-raider-monster-train-2" },
  { date: "2026-11-03", label: "Coca-Cola Christmas Truck vote closes, 16:00 GMT", slug: "coca-cola-christmas-truck-tour-2026-uk-vote-closes-3-november-dates" },
  { date: "2026-11-21", label: "Ottawa Help Santa Toy Parade, 11 a.m. ET", slug: "toronto-santa-claus-parade-2026-sunday-november-22-route-citytv" },
  { date: "2026-11-22", label: "Toronto Santa Claus Parade (122nd)", slug: "toronto-santa-claus-parade-2026-sunday-november-22-route-citytv" },
  { date: "2027-04-01", label: "UK National Living Wage rises to £13.21", slug: "uk-budget-2026-date-wednesday-28-october-what-time" },
  { date: "2027-07-01", label: "UK fuel duty cut ends (Budget 2026)", slug: "uk-budget-2026-date-wednesday-28-october-what-time" },
  { date: "2026-11-29", label: "First Sunday of Advent", slug: "advent-calendar-2026-dates-free-printable" },
  { date: "2026-12-01", label: "Advent calendars begin: door 1", slug: "advent-calendar-2026-dates-free-printable" },
  { date: "2026-12-07", label: "Medicare open enrollment ends", slug: "medicare-open-enrollment-2026-december-7-90-dollar-rebate" },
  { date: "2026-12-11", label: "Federal government funding deadline", slug: "government-funding-deadline-december-11-2026-shutdown" },
  { date: "2026-12-17", label: "USPS Ground Advantage deadline for Christmas", slug: "usps-holiday-shipping-deadlines-2026" },
  { date: "2026-12-15", label: "ACA deadline for Jan. 1 coverage", slug: "aca-open-enrollment-2027-dates-november-1-january-15" },
  { date: "2026-12-31", label: "First SSI payment with the 3.6% COLA", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2027-01-04", label: "ISO week 1 of 2027 begins", slug: "week-numbers-2027-calendar-printable" },
  { date: "2027-01-13", label: "First Social Security payments with the 3.6% COLA", slug: "social-security-cola-2027-3-6-percent-payment-dates" },
  { date: "2027-01-22", label: "Wolf Moon, the first full moon of 2027", slug: "moon-phases-2027-full-moon-calendar" },
  { date: "2027-02-06", label: "Lunar New Year, Year of the Goat", slug: "lunar-new-year-2027-year-of-the-goat" },
  { date: "2027-02-08", label: "Ramadan 2027 expected to begin", slug: "ramadan-2027-calendar-dates-timetable" },
  { date: "2027-03-09", label: "Eid al-Fitr", slug: "ramadan-2027-calendar-dates-timetable" },
  { date: "2026-10-23", label: "SAT registration deadline for Nov. 7", slug: "sat-act-test-dates-2026-27-registration-deadlines" },
  { date: "2026-11-07", label: "SAT test day", slug: "sat-act-test-dates-2026-27-registration-deadlines" },
  { date: "2026-11-11", label: "November LSAT begins (Nov. 11-14)", slug: "lsat-test-dates-2026-27-registration-deadlines" },
  { date: "2026-11-23", label: "Thanksgiving week off in Miami-Dade, Broward and Palm Beach", slug: "broward-county-school-calendar-2026-27" },
  { date: "2026-12-01", label: "LSAT registration deadline for January", slug: "lsat-test-dates-2026-27-registration-deadlines" },
  { date: "2026-12-12", label: "ACT test day", slug: "sat-act-test-dates-2026-27-registration-deadlines" },
  { date: "2027-01-01", label: "New Year's Day, first federal holiday of 2027", slug: "federal-holidays-2027-observed-dates-list" },
  { date: "2027-03-26", label: "Good Friday: stock market closed", slug: "stock-market-holidays-2027-nyse-closed-dates" },
  { date: "2027-03-26", label: "Ultra Music Festival in Miami (March 26-28)", slug: "ultra-music-festival-2027-miami-dates-march-26-28" },
  { date: "2026-10-22", label: "This day in history: Oct. 22", slug: "october-22-2026-this-day-in-history-observances" },
  { date: "2026-10-23", label: "Mole Day, 6:02 a.m. to 6:02 p.m.", slug: "mole-day-2026-october-23-6-02" },
  { date: "2026-10-23", label: "World Series Game 1, 8 p.m. ET on FOX", slug: "world-series-2026-schedule-game-times-tv-channel" },
  { date: "2026-10-24", label: "DEA Prescription Drug Take Back Day, 10 a.m.-2 p.m.", slug: "dea-drug-take-back-day-october-24-2026-locations" },
  { date: "2026-10-25", label: "Hunter's Moon rises at sunset (full 12:12 a.m. EDT Oct. 26)", slug: "hunters-moon-october-2026-full-moon-time" },
  { date: "2026-10-27", label: "Carabao Cup Round Four: Fleetwood v Arsenal, 8pm GMT (4 p.m. ET)", slug: "carabao-cup-fourth-round-2026-schedule-kickoff-times-tv-us-uk" },
  { date: "2026-10-28", label: "Carabao Cup: Liverpool v Chelsea 8pm GMT, quarter-final draw after", slug: "carabao-cup-fourth-round-2026-schedule-kickoff-times-tv-us-uk" },
  { date: "2026-10-31", label: "Rolex Paris Masters begins (qualifying), Nanterre", slug: "paris-masters-2026-schedule-final-time-by-time-zone" },
  { date: "2026-11-08", label: "Paris Masters singles final, 3 p.m. CET (9 a.m. ET)", slug: "paris-masters-2026-schedule-final-time-by-time-zone" },
  { date: "2026-11-13", label: "BBC Children in Need Appeal Night", slug: "children-in-need-2026-date-friday-13-november-appeal-night" },
  { date: "2026-11-28", label: "Federal use-or-lose annual leave scheduling deadline", slug: "federal-pay-period-calendar-2027-pay-dates-nfc-gsa-printable" },
  { date: "2027-01-07", label: "First NFC federal pay date of 2027", slug: "federal-pay-period-calendar-2027-pay-dates-nfc-gsa-printable" },
  { date: "2026-10-30", label: "Nevada Day · November SSI paid early", slug: "social-security-payment-schedule-october-2026-who-gets-paid-today" },
  { date: "2026-11-01", label: "Sunset jumps an hour earlier", slug: "sunset-times-after-daylight-saving-time-ends-2026" },
  { date: "2026-12-21", label: "Winter break begins in most large school districts", slug: "winter-break-2026-school-districts-dates" },
  { date: "2027-01-15", label: "Fourth-quarter 2026 estimated tax due", slug: "tax-calendar-2027-irs-deadlines" },
  { date: "2027-04-15", label: "Tax Day 2027", slug: "tax-calendar-2027-irs-deadlines" },
  { date: "2026-10-22", label: "Florida: last day to request a mail ballot", slug: "florida-amendments-2026-ballot-senate-special-election" },
  { date: "2026-10-23", label: "Georgia and Arizona: last day to request a mail ballot", slug: "georgia-2026-ballot-amendments-advance-voting" },
  { date: "2026-10-24", label: "Early voting opens in Michigan, Florida and New York", slug: "early-voting-starts-october-24-michigan-new-york-2026" },
  { date: "2026-10-27", label: "Pennsylvania mail ballot applications due, 5 p.m.", slug: "pennsylvania-2026-election-governor-mail-ballot-deadlines" },
  { date: "2026-10-27", label: "Mail your ballot by today (USPS advice)", slug: "mail-ballot-deadlines-2026-by-state" },
  { date: "2026-10-30", label: "Texas early voting ends; find your sample ballot by ZIP code", slug: "sample-ballot-by-zip-code-2026-texas-ballot" },
  { date: "2026-11-03", label: "Polls close from 6 p.m. ET", slug: "what-time-do-polls-close-election-day-2026" },
  { date: "2026-11-04", label: "Election results: when each state finishes counting", slug: "when-will-we-know-election-results-2026-midterms" },
  { date: "2026-11-27", label: "Black Friday: store opening times", slug: "black-friday-2026-store-hours-walmart-target-best-buy" },
  { date: "2026-12-24", label: "Christmas Eve: stores close early", slug: "christmas-eve-christmas-day-2026-store-hours" },
  { date: "2026-11-11", label: "Veterans Day: free meals and discounts list", slug: "veterans-day-free-meals-discounts" },
  { date: "2026-11-12", label: "GTA 6 pre-load opens; boxed edition on sale", slug: "gta-6-october-22-2026-what-is-confirmed-release-countdown" },
  { date: "2026-11-19", label: "GTA 6 launches on PS5 and Xbox Series X|S", slug: "gta-6-october-22-2026-what-is-confirmed-release-countdown" },
  { date: "2026-12-01", label: "Georgia runoff, if needed", slug: "georgia-2026-ballot-amendments-advance-voting" },
  { date: "2026-11-03", label: "Lyft VOTE26: 50% off one ride to the polls, up to $10", slug: "free-rides-to-the-polls-2026-lyft-uber-transit" },
  { date: "2026-11-12", label: "Northern Taurid meteor shower peaks (Nov. 11-12)", slug: "november-2026-meteor-showers-taurids-leonids" },
  { date: "2026-11-21", label: "Start thawing a 16-20 lb turkey in the fridge (Nov. 21-22)", slug: "when-to-thaw-thanksgiving-turkey-2026" },
  { date: "2026-12-09", label: "USPS: send-by date for international gifts (Priority Mail International)", slug: "usps-holiday-shipping-deadlines-2026" },
  { date: "2027-01-15", label: "ACA open enrollment for 2027 ends", slug: "aca-open-enrollment-2027-dates-november-1-january-15" },
  { date: "2026-11-24", label: "California king tides (Nov. 24-26)", slug: "king-tides-2026-dates-this-week-high-tide-times" },
  { date: "2026-12-23", label: "California king tides (Dec. 23-25)", slug: "king-tides-2026-dates-this-week-high-tide-times" },
  { date: "2026-11-21", label: "Las Vegas Grand Prix: race 11 p.m. ET", slug: "las-vegas-grand-prix-2026-schedule-race-time-by-time-zone" },
  { date: "2027-05-15", label: "Eurovision 2027 grand final, Burgas", slug: "eurovision-2027-dates-burgas-semi-finals-grand-final-may-15" },
  { date: "2026-10-28", label: "UK Budget: State Pension 2027-28 rate watch", slug: "state-pension-increase-april-2027-triple-lock-budget" },
  { date: "2026-11-01", label: "MLB Gold Glove Awards, 8:30 p.m. ET on ESPN", slug: "mlb-offseason-2026-key-dates-free-agency-awards-cba" },
  { date: "2026-11-12", label: "BBWAA MVP Awards", slug: "mlb-offseason-2026-key-dates-free-agency-awards-cba" },
  { date: "2026-11-11", label: "Veterans Day: federal offices closed, NYSE open", slug: "business-days-november-december-2026-working-days-calendar" },
  { date: "2026-11-27", label: "NYSE early close, 1 p.m. ET", slug: "business-days-november-december-2026-working-days-calendar" },
  { date: "2026-11-05", label: "Canada's Eurovision vote closes, 11:59 p.m. PT", slug: "canadas-choice-eurovision-2027-vote-finalists-deadline-november-5" },
  { date: "2026-11-08", label: "WTA Finals begin at Indian Wells", slug: "wta-finals-2026-indian-wells-dates-qualified-players-time-zones" },
  { date: "2026-11-15", label: "WTA Finals end at Indian Wells", slug: "wta-finals-2026-indian-wells-dates-qualified-players-time-zones" },
  { date: "2027-03-14", label: "U.S. daylight saving time starts, 2 a.m.", slug: "clock-changes-2027-when-does-daylight-saving-time-start-again-march-14" },
  { date: "2027-03-28", label: "UK and EU clocks go forward", slug: "clock-changes-2027-when-does-daylight-saving-time-start-again-march-14" },
  { date: "2026-10-28", label: "Statue of Liberty: 140 years since its Oct. 28, 1886, dedication", slug: "statue-of-liberty-140th-anniversary-october-28-2026-timeline-visit" },
  { date: "2026-11-06", label: "FA Cup first round: Oxford City v Leicester City, 7.45pm GMT (2:45 p.m. ET)", slug: "fa-cup-first-round-2026-27-fixtures-tv-picks-kickoff-times" },
  { date: "2026-11-09", label: "FA Cup second round draw, live on TNT Sports", slug: "fa-cup-first-round-2026-27-fixtures-tv-picks-kickoff-times" },
  { date: "2026-11-01", label: "College basketball opens: Notre Dame v Villanova in Rome, 9:30 a.m. ET", slug: "college-basketball-2026-27-key-dates-season-start-march-madness-printable" },
  { date: "2026-11-10", label: "Champions Classic at the United Center, Chicago", slug: "college-basketball-2026-27-key-dates-season-start-march-madness-printable" },
  { date: "2027-03-14", label: "Selection Sunday for the 2027 NCAA tournaments", slug: "college-basketball-2026-27-key-dates-season-start-march-madness-printable" },
  { date: "2027-04-05", label: "NCAA men's championship game, Ford Field, Detroit", slug: "college-basketball-2026-27-key-dates-season-start-march-madness-printable" },
  { date: "2026-10-28", label: "Apple pre-orders open: MacBook Pro M6, iMac, iPad mini, 10:10 a.m. PT", slug: "macbook-pro-m6-imac-ipad-mini-pre-order-release-date-november-6" },
  { date: "2026-10-30", label: "HomePod mini 2 in stores", slug: "macbook-pro-m6-imac-ipad-mini-pre-order-release-date-november-6" },
  { date: "2026-11-06", label: "MacBook Pro M6, iMac M6 and iPad mini in stores", slug: "macbook-pro-m6-imac-ipad-mini-pre-order-release-date-november-6" },
  { date: "2026-11-04", label: "First announced NHL Hometown Remix game: Sabres vs. Senators, 7:30 p.m. ET", slug: "nhl-hometown-remix-jerseys-2026-27-unveil-date-game-schedule" },
  { date: "2026-11-13", label: "Friday the 13th, the last of 2026", slug: "friday-the-13th-november-13-2026-next-friday-13th-dates" },
  { date: "2026-11-29", label: "F1 Qatar Grand Prix, 11 a.m. ET", slug: "qatar-grand-prix-2026-schedule-race-time-by-time-zone" },
  { date: "2026-10-29", label: "Thursday Night Football: Panthers at Packers, 8:15 p.m. ET, Prime Video", slug: "thursday-night-football-tonight-panthers-packers-tnf-schedule-2026" },
  { date: "2026-11-05", label: "Thursday Night Football: Jaguars at Ravens, 8:15 p.m. ET", slug: "thursday-night-football-tonight-panthers-packers-tnf-schedule-2026" },
  { date: "2026-11-01", label: "Movember starts: begin clean shaven", slug: "movember-2026-dates-shave-day-60-km-move-challenge-tracker" },
  { date: "2026-11-19", label: "Hyde Park Winter Wonderland opens, 12 p.m. GMT", slug: "hyde-park-winter-wonderland-2026-dates-opening-times-tickets" },
  { date: "2027-01-03", label: "Hyde Park Winter Wonderland final day", slug: "hyde-park-winter-wonderland-2026-dates-opening-times-tickets" },
  { date: "2026-11-04", label: "Hulu: All's Fair season 2 and The Remarried Empress", slug: "new-on-hulu-november-2026-release-dates" },
  { date: "2026-11-20", label: "Percy Jackson and the Olympians season 3 on Disney+ and Hulu", slug: "new-on-hulu-november-2026-release-dates" },
  { date: "2026-11-04", label: "Stick season 2 premieres on Apple TV", slug: "new-on-apple-tv-november-2026-release-dates" },
  { date: "2026-11-13", label: "12 12 12 premieres on Apple TV", slug: "new-on-apple-tv-november-2026-release-dates" },
  { date: "2026-11-25", label: "Way of the Warrior Kid on Apple TV", slug: "new-on-apple-tv-november-2026-release-dates" },
  { date: "2026-11-07", label: "Minnesota firearms deer season opens", slug: "deer-season-2026-opening-day-gun-season-dates-by-state" },
  { date: "2026-11-21", label: "Wisconsin gun deer season opens", slug: "deer-season-2026-opening-day-gun-season-dates-by-state" },
  { date: "2026-11-28", label: "Pennsylvania regular firearms deer season opens", slug: "deer-season-2026-opening-day-gun-season-dates-by-state" },
  { date: "2026-11-08", label: "NFL in Madrid: Bengals vs. Falcons, 9:30 a.m. ET", slug: "nfl-international-games-november-2026-madrid-munich-mexico-city-kickoff-times" },
  { date: "2026-11-15", label: "NFL in Munich: Patriots vs. Lions, 9:30 a.m. ET", slug: "nfl-international-games-november-2026-madrid-munich-mexico-city-kickoff-times" },
  { date: "2026-11-22", label: "NFL in Mexico City: Vikings vs. 49ers, 8:20 p.m. ET", slug: "nfl-international-games-november-2026-madrid-munich-mexico-city-kickoff-times" },
  { date: "2026-11-08", label: "Target $30 Thanksgiving meal for six starts", slug: "thanksgiving-meal-deals-2026-aldi-lidl-target-sams-club-prices-dates" },
  { date: "2026-11-11", label: "Lidl $35.86 Thanksgiving basket starts", slug: "thanksgiving-meal-deals-2026-aldi-lidl-target-sams-club-prices-dates" },
  { date: "2026-11-03", label: "Champions League matchday 4 begins: 12:45 p.m. and 3 p.m. ET", slug: "champions-league-november-2026-schedule-kickoff-times-et-matchday-4-5" },
  { date: "2026-11-24", label: "Champions League matchday 5: Arsenal v Dortmund, 3 p.m. ET", slug: "champions-league-november-2026-schedule-kickoff-times-et-matchday-4-5" },
  { date: "2026-11-27", label: "Day after Thanksgiving: state offices closed in 19 states", slug: "is-the-day-after-thanksgiving-a-state-holiday-2026-states-closed-november-27" },
  { date: "2026-10-30", label: "Dexter: Resurrection Season 2 returns on Paramount+", slug: "new-on-paramount-plus-november-2026-yellowjackets-final-season" },
  { date: "2026-11-20", label: "Yellowjackets final season premieres on Paramount+", slug: "new-on-paramount-plus-november-2026-yellowjackets-final-season" },
];

/** Today's date in Eastern Time as YYYY-MM-DD. */
export function todayET(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Whole days from `today` to `date` (both YYYY-MM-DD). */
export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** Upcoming dates (today included) whose story is published, soonest first. */
export function upcoming(published: Set<string>, limit = 6, now: Date = new Date()): (KeyDate & { days: number })[] {
  for (const k of KEY_DATES) if (!/^\d{4}-\d{2}-\d{2}$/.test(k.date)) throw new Error(`key date "${k.label}": bad date ${k.date}`);
  const today = todayET(now);
  return KEY_DATES.filter((k) => k.date >= today && published.has(k.slug))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map((k) => ({ ...k, days: daysUntil(k.date, today) }));
}

/** Upcoming dates (today included) reported by any of `slugs`, soonest first: a story's or a topic's own dates. */
export function upcomingFor(slugs: Set<string>, now: Date = new Date()): (KeyDate & { days: number })[] {
  const today = todayET(now);
  return KEY_DATES.filter((k) => k.date >= today && slugs.has(k.slug))
    .sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
    .map((k) => ({ ...k, days: daysUntil(k.date, today) }));
}

/** Stable event id for calendar files: the date plus a slug of the label. */
export const keyDateUid = (k: KeyDate) => `${k.date}-${k.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

/**
 * Cached pages: recompute "In N days" from today's date in New York for every
 * [data-days-until="YYYY-MM-DD"] and drop the row once the date has passed. Appended to the
 * layout's inline script, so the home page, stories and topic hubs share one copy.
 */
export const DAYS_JS = `
(function(){
  var els=document.querySelectorAll('[data-days-until]'); if(!els.length) return;
  var today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date());
  els.forEach(function(el){
    if(!/^\\d{4}-\\d\\d-\\d\\d$/.test(el.getAttribute('data-days-until'))) return; // year-only values belong to the story's days-until table
    var n=Math.round((Date.parse(el.getAttribute('data-days-until'))-Date.parse(today))/864e5);
    if(n<0){ var li=el.closest('li'); if(li) li.remove(); } else el.textContent=n===0?'Today':n===1?'Tomorrow':'In '+n+' days';
  });
})();
`;
