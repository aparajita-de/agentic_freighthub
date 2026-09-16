export type TransportMode = 'ocean' | 'air' | 'ground' | 'express';

export type OceanLoadType = 'FCL' | 'LCL';
export type Incoterm = 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'CFR' | 'FCA' | 'DAP';
export type PackageType = 'Pallet' | 'Wooden Crate' | 'Carton' | '20GP Container' | '40HC Container' | 'Drums' | 'Bales';
export type ContainerSpec = '20GP' | '40HC' | '40GP' | 'LCL_SLOT' | 'EURO_PALLET';
export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';

export type ShipmentStatus = 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'ANALYZED' | 'QUOTED' | 'CLOSED' | 'CANCELLED';
export type QuoteStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'REQUESTED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'BOOKED'
  | 'PENDING_BROKER_REVIEW'
  | 'BROKER_FINALIZED'
  | 'ISSUED'
  | 'SENT_TO_COMPANY'
  | 'AGENT_REVISED'
  | 'APPROVED_BY_CUSTOMER'
  | 'UNDER_CUSTOMS_REVIEW'
  | 'ADDITIONAL_DOCS_REQUESTED'
  | 'CUSTOMS_OFFICER_APPROVED'
  | 'BOOKING_CONFIRMED';

export interface TradeDocument {
  id: string;
  name: string;
  title?: string;
  file?: string;
  type: 'invoice' | 'packing_list' | 'bol' | 'coo' | 'additional';
  fileUrl?: string;
  dataUrl?: string;
  fileSize?: string;
  size?: string;
  uploadedAt: string;
  status: 'uploaded' | 'verified' | 'rejected' | 'pending' | 'approved';
  companyStatus?: 'awaiting_review' | 'approved' | 'rejected';
  customsStatus?: 'awaiting_review' | 'approved' | 'rejected';
  verifiedBy?: string;
  verificationNotes?: string;
  companyNotes?: string;
  rejectionReason?: string;
}

export interface RequestedDocument {
  id: string;
  name: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'submitted';
  submittedAt?: string;
  fileName?: string;
}

export interface CarrierOptionQuote {
  carrierId: string;
  carrierName: string;
  logoCode?: string;
  totalOfferInr: number;
  currency: CurrencyCode;
  transitDays: number;
  directOrTranshipment: string;
  reliabilityScore: string;
  freeDetentionDays: number;
  co2EmissionsKg?: number;
  equipmentAvailability: 'High' | 'Guaranteed' | 'Limited' | string;
  features: string[];
  breakdown: {
    baseFreight: number;
    bafFuelSurcharge: number;
    terminalHandlingCharge: number;
    documentationFee: number;
    insuranceFee: number;
    riskAdjustment: number;
    taxAmount: number;
    total: number;
  };
}

export interface PlatformNotification {
  id: string;
  targetRole: 'customer' | 'freight-agent' | 'customs-officer' | 'admin';
  targetUserEmail?: string;
  quoteId?: string;
  selectionRef?: string;
  bookingId?: string;
  title: string;
  message: string;
  type: 'info' | 'action_required' | 'success' | 'warning';
  timestamp: string;
  isRead: boolean;
  actionView?: string;
}

export interface AuditLogRecord {
  id: string;
  quoteId: string;
  action: string;
  modifiedBy: string;
  reason?: string;
  previousValue?: string | number;
  newValue?: string | number;
  timestamp: string;
}

export interface PortHub {
  code: string;
  name: string;
  city: string;
  country: string;
  type: 'sea' | 'air' | 'ground';
  locationLabel: string;
}

export interface PickupDeliveryPoint {
  id: string;
  name: string;
  category: 'pickup' | 'delivery';
  address: string;
}

export interface CargoLineItem {
  id: string;
  packageType: PackageType;
  containerSpec: ContainerSpec;
  quantity: number;
  grossWeightKg: number;
  commodityDescription: string;
  hsCode: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface QuoteFormState {
  originPortCode: string;
  destinationPortCode: string;
  pickupHubId: string;
  deliveryHubId: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  cargoReadyDate: string;
  requiredDeliveryDate: string;
  transportMode: TransportMode;
  oceanLoadType: OceanLoadType;
  incoterm: Incoterm;
  cargoItems: CargoLineItem[];
  declaredValue: number;
  currency: CurrencyCode;
  specialInstructions: string;
  fragileGoods: boolean;
  hazardousMaterials: boolean;
  temperatureControlled: boolean;
  addCargoInsurance: boolean;
  promoCodeApplied: string | null;
  fullName: string;
  companyName: string;
  email: string;
  country: string;
  // Custom pricing parameters (editable & reactive)
  baseRatePerUnit?: number;
  bafPercentage?: number;
  originThcPerUnit?: number;
  documentationFeeAmount?: number;
  marginPercentage?: number;
}

export interface TariffBreakdown {
  baseTariff: number;
  baseRatePerUnit?: number;
  containerCount?: number;
  bafPercentage?: number;
  bafFuelSurcharge: number;
  originThcPerUnit?: number;
  terminalHandlingCharge: number;
  documentationFee: number;
  specialHandlingSurcharge: number;
  insuranceFee: number;
  discountAmount: number;
  totalCost?: number;
  marginPercentage?: number;
  marginAmount?: number;
  finalSellPrice?: number;
  subtotal: number;
  estimatedTax: number;
  grandTotal: number;
  currency: CurrencyCode;
  chargeBasis: string;
  cargoCountSummary: string;
  totalWeightKg: number;
  estimatedDistanceNmOrKm: string;
  estimatedTransitDays: string;
  estimatedArrivalDate: string;
  originPortName?: string;
  destPortName?: string;
  carrierName?: string;
  transitDaysRange?: string;
  equipmentSummary?: string;
  ruleBasedPriceInr?: number;
  aiPredictedPriceInr?: number;
  recommendedPriceInr?: number;
  weatherRiskScore?: number;
  customsRiskScore?: number;
  routeRiskScore?: number;
  compositeRiskScore?: number;
  overallRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  chargeableWeightKg?: number;
  totalVolumeCbm?: number;
  totalTariffInr?: number;
  baseFreightInr?: number;
  fuelSurchargeInr?: number;
  bunkerFuelSurchargeInr?: number;
  terminalHandlingInr?: number;
  terminalHandlingOriginInr?: number;
  terminalHandlingDestInr?: number;
  documentationFeeInr?: number;
  cargoInsuranceInr?: number;
  aiMarketRiskAdjustmentInr?: number;
  gstVatInr?: number;
}

export interface SavedQuotation {
  id: string;
  shipmentId?: string;
  shipperName: string;
  shipperEmail?: string;
  companyName: string;
  routeSummary: string;
  originCode: string;
  destinationCode: string;
  transportMode: TransportMode;
  oceanLoadType?: OceanLoadType;
  tariffAmount: number;
  currency: CurrencyCode;
  shipmentStatus?: ShipmentStatus;
  status: QuoteStatus;
  createdAt: string;
  validUntil?: string;
  cargoSummary: string;
  breakdown: TariffBreakdown;
  formData: QuoteFormState;
  brokerReviewNotes?: string;
  brokerAdjustedAt?: string;
  assignedCarrier?: string;
  brokerMarginPct?: number;
  brokerProfitInr?: number;
  isBrokerEdited?: boolean;
  brokerReviewed?: boolean;
  priceModificationReason?: string;
  customsFlags?: string[];
  customsCaseId?: string;
  customsStatus?: string;
  weatherAlerts?: string[];
  auditLogs?: AuditLogRecord[];
  selectionRef?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  selectedCarrier?: CarrierOptionQuote;
  selectedCarrierOption?: CarrierOptionQuote;
  carrierQuotes?: CarrierOptionQuote[];
  uploadedDocuments?: TradeDocument[];
  tradeDocuments?: TradeDocument[];
  requestedDocuments?: RequestedDocument[];
  bookingReference?: string;
  clearanceCertificateNumber?: string;
  carrierVoyageNumber?: string;
  containerEquipmentNumber?: string;
  containerSealNumber?: string;
  freeDetentionDays?: number;
  agentVerifiedAt?: string;
  agentChecklist?: Record<string, 'confirmed' | 'needs_attention' | 'cannot_be_met'> | { id: string; name: string; status: string; verifiedAt?: string; }[];
  agentNotes?: string;
  agentRevisedPrice?: number;
  agentRevisedBreakdown?: TariffBreakdown;
  customsOfficerNotes?: string;
  customsClearanceDate?: string;
  customerConfirmedAt?: string;
}

export interface QuoteDraft {
  id: string;
  title: string;
  savedAt: string;
  formData: QuoteFormState;
  routeSummary: string;
  transportMode: TransportMode;
  totalWeightKg: number;
  estimatedTariffInr: number;
}

export interface TrackingStep {
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface ContainerTrackingRecord {
  trackingId: string;
  quoteId: string;
  containerNo: string;
  vesselOrFlight: string;
  carrier: string;
  origin: string;
  destination: string;
  status: 'BOOKED' | 'IN_TRANSIT' | 'CUSTOMS_CLEARANCE' | 'DELIVERED';
  statusText: string;
  eta: string;
  progressPercentage: number;
  currentLocation: string;
  timeline: TrackingStep[];
}

export interface PromoCoupon {
  code: string;
  title: string;
  description: string;
  validityText: string;
  badgeText: string;
  discountType: 'percentage' | 'flat' | 'doc_free';
  discountValue: number;
  applicableMode?: TransportMode;
  minWeightKg?: number;
}

export interface CorridorBenchmark {
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  mode: string;
  transitTime: string;
  rateInr: string;
}

export type UserRole = 'customer' | 'user' | 'shipper' | 'freight-agent' | 'customs-officer' | 'customer-officer' | 'admin' | 'business' | 'broker';

export * from './types/milestone3';

export interface BrokerClientQuote extends SavedQuotation {
  brokerMarginPct?: number;
  carrierBuyRate?: number;
  brokerProfitInr?: number;
  carrierName?: string;
  brokerageRef?: string;
}

export interface CarrierSpotRate {
  id: string;
  carrierName: string;
  carrierLogo?: string;
  originPort: string;
  destinationPort: string;
  mode: TransportMode;
  equipment: string;
  buyRateInr: number;
  suggestedSellInr: number;
  transitDays: number;
  validUntil: string;
  spaceAvailability: 'High' | 'Medium' | 'Tight';
  reliabilityScore: string;
  directOrTranshipment: string;
}

export interface CommissionLedgerItem {
  id: string;
  shipmentRef: string;
  clientName: string;
  route: string;
  carrier: string;
  buyCostInr: number;
  sellPriceInr: number;
  marginPct: number;
  commissionEarnedInr: number;
  status: 'SETTLED' | 'PENDING_PAYOUT' | 'IN_PROCESSING';
  date: string;
}
