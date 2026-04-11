/**
 * POTAL Denied Party Screening — Public API
 *
 * CW33-HF1: re-export the DB-backed screeners under the canonical names
 * (`screenParty`, `screenParties`). The in-memory implementation in
 * `./screen.ts` is kept as an emergency fallback that `db-screen.ts`
 * calls when the Supabase query fails (network outage). Production API
 * paths hit the 47,926-row `sanctioned_entities` table via these
 * re-exports.
 *
 * BREAKING vs CW32: `screenParty` / `screenParties` are now **async**.
 * All callers must `await`.
 */
export { screenPartyDb as screenParty, screenPartiesDb as screenParties } from './db-screen';
export type {
  ScreeningInput,
  ScreeningResult,
  ScreeningMatch,
  ScreeningList,
} from './types';
