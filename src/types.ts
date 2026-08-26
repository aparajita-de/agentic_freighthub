export type TransportMode = 'ocean' | 'air' | 'ground' | 'express';

export type OceanLoadType = 'FCL' | 'LCL';
export type Incoterm = 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'CFR';
export type PackageType = 'Pallet' | 'Wooden Crate' | 'Carton' | '20GP Container' | '40HC Container' | 'Drums' | 'Bales';
export type ContainerSpec = '20GP' | '40HC' | '40GP' | 'LCL_SLOT' | 'EURO_PALLET';
export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';

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
  equipmentSummary?: string;
}

export interface SavedQuotation {
  id: string;
  shipperName: string;
  companyName: string;
  routeSummary: string;
  originCode: string;
  destinationCode: string;
  transportMode: TransportMode;
  oceanLoadType?: OceanLoadType;
  tariffAmount: number;
  currency: CurrencyCode;
  status: 'DRAFT' | 'PENDING_BROKER_REVIEW' | 'BROKER_FINALIZED' | 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'BOOKED';
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

export type UserRole = 'shipper' | 'user' | 'business' | 'freight-agent' | 'broker' | 'admin' | 'customer-officer' | 'customs-officer';

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
