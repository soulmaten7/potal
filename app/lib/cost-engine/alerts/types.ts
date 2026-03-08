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
  /** Whether this alert is active */
  isActive: boolean;
  /** Created timestamp */
  createdAt: string;
  /** Last checked timestamp */
  lastCheckedAt?: string;
  /** Last triggered timestamp (when rate changed) */
  lastTriggeredAt?: string;
}

export interface TariffAlertCreateInput {
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
  webhookUrl?: string;
  notifyEmail?: string;
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
}
