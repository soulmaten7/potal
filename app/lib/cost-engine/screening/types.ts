/**
 * POTAL Denied Party Screening — Type Definitions
 *
 * Screens parties against major sanctions/denied party lists:
 * - OFAC SDN (US Treasury) — Specially Designated Nationals
 * - BIS Entity List (US Commerce) — Export restrictions
 * - EU Consolidated Sanctions List
 * - UN Security Council Sanctions
 */

export type ScreeningList =
  | 'OFAC_SDN'           // US Treasury OFAC Specially Designated Nationals
  | 'OFAC_CONS'          // US OFAC Consolidated Non-SDN List
  | 'OFAC_SSI'           // US OFAC Sectoral Sanctions Identifications
  | 'OFAC_FSE'           // US OFAC Foreign Sanctions Evaders
  | 'OFAC_PLC'           // US OFAC Palestinian Legislative Council
  | 'OFAC_CAPTA'         // US OFAC Correspondent Account / Payable-Through Account
  | 'OFAC_NS_MBS'        // US OFAC Non-SDN Menu-Based Sanctions
  | 'OFAC_NS_CMIC'       // US OFAC Non-SDN Chinese Military-Industrial Complex
  | 'BIS_ENTITY'         // US BIS Entity List
  | 'BIS_DPL'            // US BIS Denied Persons List
  | 'BIS_UVL'            // US BIS Unverified List
  | 'BIS_MEU'            // US BIS Military End User List
  | 'BIS_DENIED'         // US BIS Denied Persons (legacy alias)
  | 'BIS_UNVERIFIED'     // US BIS Unverified List (legacy alias)
  | 'STATE_DTC'          // US State Dept ITAR Debarred
  | 'STATE_ISN'          // US State Dept Nonproliferation Sanctions
  | 'EU_SANCTIONS'       // EU Consolidated Financial Sanctions
  | 'UN_SANCTIONS'       // UN Security Council Consolidated List
  | 'UK_SANCTIONS';      // UK HMT Financial Sanctions

export interface ScreeningMatch {
  /** Which list matched */
  list: ScreeningList;
  /** Display name of the list */
  listName: string;
  /** Name of the matched entity */
  entityName: string;
  /** Match score (0-1, 1 = exact match) */
  matchScore: number;
  /** Entity type */
  entityType: 'individual' | 'entity' | 'vessel' | 'aircraft';
  /** Country of the matched entity */
  country?: string;
  /** Reason/program for designation */
  programs: string[];
  /** Whether the match is an alias */
  isAlias: boolean;
  /** Remarks/notes */
  remarks?: string;
}

export interface ScreeningResult {
  /** Whether any matches were found */
  hasMatches: boolean;
  /** Screening status */
  status: 'clear' | 'potential_match' | 'match';
  /** Total number of matches */
  totalMatches: number;
  /** Matches by list */
  matches: ScreeningMatch[];
  /** Input that was screened */
  screenedInput: {
    name: string;
    country?: string;
    address?: string;
  };
  /** Timestamp of screening */
  screenedAt: string;
  /** Lists that were checked */
  listsChecked: ScreeningList[];
}

export interface ScreeningInput {
  /** Party name to screen */
  name: string;
  /** Country ISO code (optional, narrows search) */
  country?: string;
  /** Address (optional) */
  address?: string;
  /** Which lists to check (default: all) */
  lists?: ScreeningList[];
  /** Minimum match score threshold (default: 0.8) */
  minScore?: number;
}
