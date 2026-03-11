/**
 * POTAL Tariff Alert — Type Definitions
 *
 * Sellers can subscribe to tariff rate changes for specific
 * HS code + destination country combinations.
 */

export interface TariffAlert {
  /** Unique alert ID */
  id: string;
  /** Seller ID (owner) */
  sellerId: string;
  /** HS Code to monitor (4-6 digits) */
  hsCode: string;
  /** Origin country ISO 2-letter code */
  originCountry: string;
  /** Destination country ISO 2-letter code */
  destinationCountry: string;
  /** Last known duty rate (%) */
  lastKnownRate: number;
  /** Source of last known rate */
  lastKnownRateSource: string;
  /** Webhook URL for notifications (optional) */
  webhookUrl?: string;
  /** Email for notifications (optional) */
  notifyEmail?: string;
  /** Alert types subscribed to */
  alertTypes: AlertType[];
  /** Whether this alert is active */
  isActive: boolean;
  /** Created timestamp */
  createdAt: string;
  /** Last checked timestamp */
  lastCheckedAt?: string;
  /** Last triggered timestamp (when rate changed) */
  lastTriggeredAt?: string;
}

export type AlertType = 'tariff_change' | 'fta_update' | 'trade_remedy' | 'section_301' | 'regulation_change';

export interface TariffAlertCreateInput {
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
  webhookUrl?: string;
  notifyEmail?: string;
  /** Alert types to subscribe to (default: all) */
  alertTypes?: AlertType[];
}

export interface TariffChangeEvent {
  alertId: string;
  sellerId: string;
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
  previousRate: number;
  newRate: number;
  changePercent: number;
  rateSource: string;
  detectedAt: string;
  /** Type of change that triggered the alert */
  eventType: AlertType;
  /** Additional details about the change */
  details?: {
    /** FTA name (for fta_update) */
    ftaName?: string;
    /** Trade remedy case ID (for trade_remedy) */
    caseId?: number;
    /** Section 301 list (for section_301) */
    listName?: string;
    /** Description of the change */
    description?: string;
  };
}
