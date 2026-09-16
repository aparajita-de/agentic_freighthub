import { QuoteFormState, TariffBreakdown, CarrierOptionQuote } from '../types';
import { getMasterDataSnapshot } from '../services/masterDataService';

export const generateCarrierOptionQuotes = (
  formData: QuoteFormState,
  breakdown: TariffBreakdown
): CarrierOptionQuote[] => {
  const isAir = formData.transportMode === 'air' || formData.transportMode === 'express';
  
  // Safe baseline price calculation (strictly positive, no NaN)
  const basePrice = Math.max(
    25000,
    Number(breakdown?.grandTotal) ||
    Number(breakdown?.finalSellPrice) ||
    Number(breakdown?.subtotal) ||
    Number(breakdown?.totalCost) ||
    Number(breakdown?.baseTariff ? breakdown.baseTariff * 1.35 : 0) ||
    (isAir ? 65000 : 145000)
  );

  const cargoWeight = Math.max(
    100,
    Number(breakdown?.totalWeightKg) ||
    Number(breakdown?.chargeableWeightKg) ||
    (formData.cargoItems?.reduce((sum, item) => sum + (Number(item.grossWeightKg) || 0) * (Number(item.quantity) || 1), 0)) ||
    1200
  );

  const baseTariffVal = Number(breakdown?.baseTariff) || Math.round(basePrice * 0.62);
  const bafVal = Number(breakdown?.bafFuelSurcharge) || Math.round(basePrice * 0.11);
  const thcVal = Number(breakdown?.terminalHandlingCharge) || Math.round(basePrice * 0.08);
  const docVal = Number(breakdown?.documentationFee) || 4500;
  const insVal = Number(breakdown?.insuranceFee) || Math.max(1800, Math.round(basePrice * 0.025));
  const riskVal = Number(breakdown?.specialHandlingSurcharge) || Math.round(basePrice * 0.035);

  // Retrieve active registered carriers from Master Data (Admin Portal source of truth)
  let registeredCarriers: any[] = [];
  try {
    const snapshot = getMasterDataSnapshot();
    if (snapshot && Array.isArray(snapshot.carriers)) {
      registeredCarriers = snapshot.carriers.filter((c) => c.isActive !== false);
    }
  } catch (err) {
    console.warn('Could not read master carriers snapshot, fallback to default:', err);
  }

  if (isAir) {
    // Only registered AIR carriers
    const airCarriers = registeredCarriers.filter((c) => c.mode === 'AIR');
    const hasEk = airCarriers.some((c) => c.carrierCode === 'EK' || c.carrierName?.toLowerCase().includes('emirates'));
    const hasQr = airCarriers.some((c) => c.carrierCode === 'QR' || c.carrierName?.toLowerCase().includes('qatar'));
    const hasDhl = airCarriers.some((c) => c.carrierCode === 'DHL' || c.carrierName?.toLowerCase().includes('dhl'));

    // Emirates SkyCargo (Registered)
    const ekBase = Math.round(baseTariffVal * 1.02);
    const ekBaf = Math.round(bafVal * 1.05);
    const ekThc = Math.round(thcVal * 1.02);
    const ekDoc = 4000;
    const ekIns = Math.max(1500, insVal);
    const ekRisk = Math.round(riskVal * 1.02);
    const ekTax = Math.round((ekBase + ekBaf + ekThc + ekDoc + ekIns + ekRisk) * 0.12);
    const ekTotal = ekBase + ekBaf + ekThc + ekDoc + ekIns + ekRisk + ekTax;

    // Qatar Airways Cargo (Registered)
    const qrBase = Math.round(baseTariffVal * 0.96);
    const qrBaf = Math.round(bafVal * 0.98);
    const qrThc = Math.round(thcVal * 0.97);
    const qrDoc = 3800;
    const qrIns = Math.max(1500, Math.round(insVal * 0.98));
    const qrRisk = Math.round(riskVal * 0.95);
    const qrTax = Math.round((qrBase + qrBaf + qrThc + qrDoc + qrIns + qrRisk) * 0.12);
    const qrTotal = qrBase + qrBaf + qrThc + qrDoc + qrIns + qrRisk + qrTax;

    // DHL Global Forwarding (Registered)
    const dhlBase = Math.round(baseTariffVal * 1.06);
    const dhlBaf = Math.round(bafVal * 1.03);
    const dhlThc = Math.round(thcVal * 1.04);
    const dhlDoc = 4500;
    const dhlIns = Math.max(1600, Math.round(insVal * 1.04));
    const dhlRisk = Math.round(riskVal * 1.05);
    const dhlTax = Math.round((dhlBase + dhlBaf + dhlThc + dhlDoc + dhlIns + dhlRisk) * 0.12);
    const dhlTotal = dhlBase + dhlBaf + dhlThc + dhlDoc + dhlIns + dhlRisk + dhlTax;

    const list: CarrierOptionQuote[] = [];

    if (hasEk || airCarriers.length === 0) {
      list.push({
        carrierId: 'emirates-skycargo',
        carrierName: 'Emirates SkyCargo',
        logoCode: 'EK',
        totalOfferInr: ekTotal,
        currency: 'INR',
        transitDays: 1,
        directOrTranshipment: 'Direct Daily Priority Flight',
        reliabilityScore: '99%',
        freeDetentionDays: 3,
        co2EmissionsKg: Math.round(cargoWeight * 0.8),
        equipmentAvailability: 'Guaranteed Space',
        features: [
          'Guaranteed Main-Deck ULD Space Allocation',
          'Temperature-Controlled Pharma/Perishable Hold',
          'Automated SkyChain AIS Live Telemetry',
          'Priority Airport Ramp Transfer at DXB Hub'
        ],
        breakdown: {
          baseFreight: ekBase,
          bafFuelSurcharge: ekBaf,
          terminalHandlingCharge: ekThc,
          documentationFee: ekDoc,
          insuranceFee: ekIns,
          riskAdjustment: ekRisk,
          taxAmount: ekTax,
          total: ekTotal,
        }
      });
    }

    if (hasQr || airCarriers.length === 0) {
      list.push({
        carrierId: 'qatar-airways-cargo',
        carrierName: 'Qatar Airways Cargo',
        logoCode: 'QR',
        totalOfferInr: qrTotal,
        currency: 'INR',
        transitDays: 2,
        directOrTranshipment: 'Via Hamad Intl Hub (DOH)',
        reliabilityScore: '97%',
        freeDetentionDays: 4,
        co2EmissionsKg: Math.round(cargoWeight * 0.85),
        equipmentAvailability: 'High Priority',
        features: [
          'Dedicated QR Freighter Boeing 777F Capacity',
          'Rapid 4-Hour DOH Airside Transshipment',
          'Secure Valuables & Electronics Protection Protocol',
          'Free 4-Day Airport Storage at Destination'
        ],
        breakdown: {
          baseFreight: qrBase,
          bafFuelSurcharge: qrBaf,
          terminalHandlingCharge: qrThc,
          documentationFee: qrDoc,
          insuranceFee: qrIns,
          riskAdjustment: qrRisk,
          taxAmount: qrTax,
          total: qrTotal,
        }
      });
    }

    if (hasDhl || airCarriers.length === 0) {
      list.push({
        carrierId: 'dhl-global-forwarding',
        carrierName: 'DHL Global Forwarding',
        logoCode: 'DHL',
        totalOfferInr: dhlTotal,
        currency: 'INR',
        transitDays: 2,
        directOrTranshipment: 'DHL Express Global Air Network',
        reliabilityScore: '98%',
        freeDetentionDays: 5,
        co2EmissionsKg: Math.round(cargoWeight * 0.78),
        equipmentAvailability: 'Guaranteed Capacity',
        features: [
          'DHL GoGreen Certified Carbon Offset Program',
          'Dedicated Dangerous Goods (DG) Specialist Desk',
          'End-to-End Customs Brokerage Fast-Track Assist',
          'Priority Delivery SLA Warranty Guarantee'
        ],
        breakdown: {
          baseFreight: dhlBase,
          bafFuelSurcharge: dhlBaf,
          terminalHandlingCharge: dhlThc,
          documentationFee: dhlDoc,
          insuranceFee: dhlIns,
          riskAdjustment: dhlRisk,
          taxAmount: dhlTax,
          total: dhlTotal,
        }
      });
    }

    return list.slice(0, 3);
  }

  // Ocean Freight Carriers registered in Admin Master Data
  const oceanCarriers = registeredCarriers.filter((c) => c.mode === 'OCEAN');
  const hasMaersk = oceanCarriers.some((c) => c.carrierCode === 'MAEU' || c.carrierName?.toLowerCase().includes('maersk'));
  const hasMsc = oceanCarriers.some((c) => c.carrierCode === 'MSCU' || c.carrierName?.toLowerCase().includes('msc'));
  const hasCma = oceanCarriers.some((c) => c.carrierCode === 'CMDU' || c.carrierName?.toLowerCase().includes('cma'));
  const hasAbc = oceanCarriers.some((c) => c.carrierCode === 'ABCS' || c.carrierName?.toLowerCase().includes('abc'));

  // Baseline breakdown for Maersk Line
  const maerskBase = Math.round(baseTariffVal);
  const maerskBaf = Math.round(bafVal);
  const maerskThc = Math.round(thcVal);
  const maerskDoc = 4500;
  const maerskIns = Math.max(2200, insVal);
  const maerskRisk = Math.round(riskVal);
  const maerskTax = Math.round((maerskBase + maerskBaf + maerskThc + maerskDoc + maerskIns + maerskRisk) * 0.12);
  const maerskTotal = maerskBase + maerskBaf + maerskThc + maerskDoc + maerskIns + maerskRisk + maerskTax;

  // MSC Mediterranean
  const mscBase = Math.round(baseTariffVal * 0.94);
  const mscBaf = Math.round(bafVal * 0.97);
  const mscThc = Math.round(thcVal * 0.96);
  const mscDoc = 4200;
  const mscIns = Math.max(2000, Math.round(insVal * 0.97));
  const mscRisk = Math.round(riskVal * 0.95);
  const mscTax = Math.round((mscBase + mscBaf + mscThc + mscDoc + mscIns + mscRisk) * 0.12);
  const mscTotal = mscBase + mscBaf + mscThc + mscDoc + mscIns + mscRisk + mscTax;

  // CMA CGM
  const cmaBase = Math.round(baseTariffVal * 1.04);
  const cmaBaf = Math.round(bafVal * 1.02);
  const cmaThc = Math.round(thcVal * 1.03);
  const cmaDoc = 4800;
  const cmaIns = Math.max(2400, Math.round(insVal * 1.03));
  const cmaRisk = Math.round(riskVal * 1.02);
  const cmaTax = Math.round((cmaBase + cmaBaf + cmaThc + cmaDoc + cmaIns + cmaRisk) * 0.12);
  const cmaTotal = cmaBase + cmaBaf + cmaThc + cmaDoc + cmaIns + cmaRisk + cmaTax;

  // ABC Shipping
  const abcBase = Math.round(baseTariffVal * 0.92);
  const abcBaf = Math.round(bafVal * 0.95);
  const abcThc = Math.round(thcVal * 0.95);
  const abcDoc = 4000;
  const abcIns = Math.max(1900, Math.round(insVal * 0.95));
  const abcRisk = Math.round(riskVal * 0.94);
  const abcTax = Math.round((abcBase + abcBaf + abcThc + abcDoc + abcIns + abcRisk) * 0.12);
  const abcTotal = abcBase + abcBaf + abcThc + abcDoc + abcIns + abcRisk + abcTax;

  const oceanList: CarrierOptionQuote[] = [];

  if (hasMaersk || oceanCarriers.length === 0) {
    oceanList.push({
      carrierId: 'maersk-line',
      carrierName: 'Maersk Line',
      logoCode: 'MAERSK',
      totalOfferInr: maerskTotal,
      currency: 'INR',
      transitDays: 14,
      directOrTranshipment: 'Direct Maritime Express Line',
      reliabilityScore: '98%',
      freeDetentionDays: 14,
      co2EmissionsKg: Math.round(cargoWeight * 0.12),
      equipmentAvailability: 'Guaranteed Allocation',
      features: [
        'Guaranteed Equipment & 40HC Container Allocation',
        'Direct Berth Priority at Discharge Terminal',
        'Captain Peter Live Reefer & AIS Telemetry',
        '14 Days Free Port Demurrage & Detention'
      ],
      breakdown: {
        baseFreight: maerskBase,
        bafFuelSurcharge: maerskBaf,
        terminalHandlingCharge: maerskThc,
        documentationFee: maerskDoc,
        insuranceFee: maerskIns,
        riskAdjustment: maerskRisk,
        taxAmount: maerskTax,
        total: maerskTotal,
      }
    });
  }

  if (hasMsc || oceanCarriers.length === 0) {
    oceanList.push({
      carrierId: 'msc-mediterranean',
      carrierName: 'MSC Mediterranean Shipping',
      logoCode: 'MSC',
      totalOfferInr: mscTotal,
      currency: 'INR',
      transitDays: 16,
      directOrTranshipment: 'Transshipment via Colombo Hub (LKCMB)',
      reliabilityScore: '95%',
      freeDetentionDays: 10,
      co2EmissionsKg: Math.round(cargoWeight * 0.14),
      equipmentAvailability: 'High Availability',
      features: [
        'Economy Maritime Freight Surcharge Discount',
        'World Largest Fleet Slot Availability',
        'Free 10 Days Combined Detention at Terminal',
        'Flexible Cargo Gate-in Window at Origin'
      ],
      breakdown: {
        baseFreight: mscBase,
        bafFuelSurcharge: mscBaf,
        terminalHandlingCharge: mscThc,
        documentationFee: mscDoc,
        insuranceFee: mscIns,
        riskAdjustment: mscRisk,
        taxAmount: mscTax,
        total: mscTotal,
      }
    });
  }

  if (hasCma || oceanCarriers.length === 0) {
    oceanList.push({
      carrierId: 'cma-cgm-logistics',
      carrierName: 'CMA CGM Global Line',
      logoCode: 'CMA CGM',
      totalOfferInr: cmaTotal,
      currency: 'INR',
      transitDays: 13,
      directOrTranshipment: 'Priority Fast-Lane Direct Service',
      reliabilityScore: '99%',
      freeDetentionDays: 12,
      co2EmissionsKg: Math.round(cargoWeight * 0.11),
      equipmentAvailability: 'Guaranteed Allocation',
      features: [
        'LNG Eco-Powered Mega Container Vessel',
        'Fastest Transit Time on Route (13 Days)',
        'SMART Container IoT Sensor Suite Included',
        'Priority Offload at Discharge Terminal'
      ],
      breakdown: {
        baseFreight: cmaBase,
        bafFuelSurcharge: cmaBaf,
        terminalHandlingCharge: cmaThc,
        documentationFee: cmaDoc,
        insuranceFee: cmaIns,
        riskAdjustment: cmaRisk,
        taxAmount: cmaTax,
        total: cmaTotal,
      }
    });
  }

  if (hasAbc && oceanList.length < 3) {
    oceanList.push({
      carrierId: 'abc-shipping',
      carrierName: 'ABC Shipping',
      logoCode: 'ABCS',
      totalOfferInr: abcTotal,
      currency: 'INR',
      transitDays: 15,
      directOrTranshipment: 'Direct Regional Coastal & Deep-Sea Loop',
      reliabilityScore: '96%',
      freeDetentionDays: 14,
      co2EmissionsKg: Math.round(cargoWeight * 0.13),
      equipmentAvailability: 'Confirmed Space',
      features: [
        'Registered Carrier in Admin Master Data',
        'Dedicated Regional Feeder Network',
        'Direct Ocean Bill of Lading Issuance',
        '14 Days Detention Allowance'
      ],
      breakdown: {
        baseFreight: abcBase,
        bafFuelSurcharge: abcBaf,
        terminalHandlingCharge: abcThc,
        documentationFee: abcDoc,
        insuranceFee: abcIns,
        riskAdjustment: abcRisk,
        taxAmount: abcTax,
        total: abcTotal,
      }
    });
  }

  return oceanList.slice(0, 3);
};
