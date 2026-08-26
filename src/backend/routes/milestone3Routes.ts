import { Router, Request, Response } from 'express';
import {
  assessWeatherForRoute,
  getAllWeatherAlerts,
  acknowledgeWeatherAlert
} from '../weather/weatherService';
import {
  validateCustomsCompliance,
  searchRegulationsRAG,
  signOffCustomsCheck,
  getAllComplianceChecks,
  getComplianceCheckById,
  uploadShipmentDocument
} from '../customs/customsService';
import {
  assessShipmentCompositeRisk,
  getShipmentRisk,
  getAllRiskAlerts,
  acknowledgeRiskAlert
} from '../risk/riskEngine';
import {
  predictMLPrice,
  compareRuleVsMLPricing,
  getMLModelEvaluationMetrics
} from '../pricing/mlPricingService';
import {
  SEEDED_DATA_FRESHNESS,
  SEEDED_SYNC_LOGS,
  SEEDED_REGULATION_DOCS,
  SEEDED_HS_CODES
} from '../../data/milestone3Data';

export const milestone3Router = Router();

// ==========================================
// 1. Weather Intelligence API Endpoints
// ==========================================

/**
 * POST /v1/weather/assess
 * Assess weather risk for route and departure window
 */
milestone3Router.post('/v1/weather/assess', (req: Request, res: Response) => {
  try {
    const { shipmentId, quoteId, routeId, originPort, destPort, departureDate, transportMode } = req.body;
    if (!originPort || !destPort) {
      return res.status(400).json({ error: 'originPort and destPort are required.' });
    }
    const assessment = assessWeatherForRoute({
      shipmentId,
      quoteId,
      routeId,
      originPort,
      destPort,
      departureDate,
      transportMode,
    });
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Customs Intelligence & RAG Endpoints
// ==========================================

/**
 * POST /v1/customs/validate
 * Validate customs requirements and documentation
 */
milestone3Router.post('/v1/customs/validate', (req: Request, res: Response) => {
  try {
    const {
      shipmentId,
      quoteId,
      originCountry,
      destCountry,
      originPort,
      destPort,
      hsCode,
      commodity,
      incoterm,
      declaredValueInr,
      isHazmat,
      uploadedDocuments,
    } = req.body;

    const complianceCheck = validateCustomsCompliance({
      shipmentId,
      quoteId,
      originCountry: originCountry || 'IN',
      destCountry: destCountry || 'SG',
      originPort: originPort || 'MAA',
      destPort: destPort || 'SGSIN',
      hsCode: hsCode || '8471.30.10',
      commodity: commodity || 'Commercial Cargo',
      incoterm: incoterm || 'FOB',
      declaredValueInr: declaredValueInr || 2000000,
      isHazmat,
      uploadedDocuments,
    });

    return res.json({ success: true, data: complianceCheck });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/customs/checks
 * List all compliance cases (Pending & Historical)
 */
milestone3Router.get('/v1/customs/checks', (req: Request, res: Response) => {
  try {
    const checks = getAllComplianceChecks();
    return res.json({ success: true, data: checks, count: checks.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/customs/checks/:id
 * Get single compliance check by ID
 */
milestone3Router.get('/v1/customs/checks/:id', (req: Request, res: Response) => {
  try {
    const check = getComplianceCheckById(req.params.id);
    if (!check) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }
    return res.json({ success: true, data: check });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/customs/:check_id/sign-off
 * Approve / Reject / Conditionally Approve customs check
 */
milestone3Router.post('/v1/customs/:check_id/sign-off', (req: Request, res: Response) => {
  try {
    const { check_id } = req.params;
    const { action, reviewerEmail, reviewerNotes } = req.body;

    if (!action || !['APPROVE', 'REQUEST_DOCUMENTS', 'CONDITIONAL', 'REJECT'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action. Must be APPROVE, REQUEST_DOCUMENTS, CONDITIONAL, or REJECT.',
      });
    }

    const updatedCheck = signOffCustomsCheck(
      check_id,
      action,
      reviewerEmail || 'customs@freighthub.in',
      reviewerNotes || 'Customs compliance review completed.'
    );

    if (!updatedCheck) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }

    return res.json({
      success: true,
      message: `Customs check ${check_id} transitioned to ${action}`,
      data: updatedCheck,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/regulations/search
 * Search regulation corpus with citations
 */
milestone3Router.post('/v1/regulations/search', (req: Request, res: Response) => {
  try {
    const { query, country, limit } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const results = searchRegulationsRAG(query, country, limit || 5);
    return res.json({ success: true, data: results, count: results.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/regulations/documents
 */
milestone3Router.get('/v1/regulations/documents', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_REGULATION_DOCS });
});

/**
 * GET /v1/customs/hs-codes
 */
milestone3Router.get('/v1/customs/hs-codes', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_HS_CODES });
});

/**
 * POST /v1/shipments/upload-document
 */
milestone3Router.post('/v1/shipments/upload-document', (req: Request, res: Response) => {
  try {
    const doc = uploadShipmentDocument(req.body);
    return res.json({ success: true, data: doc });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Shipment Composite Risk Engine Endpoints
// ==========================================

/**
 * GET /v1/risk/:shipment_id
 * Get current composite shipment risk
 */
milestone3Router.get('/v1/risk/:shipment_id', (req: Request, res: Response) => {
  try {
    const assessment = getShipmentRisk(req.params.shipment_id);
    if (!assessment) {
      // Auto generate on the fly
      const dynamic = assessShipmentCompositeRisk({
        shipmentId: req.params.shipment_id,
      });
      return res.json({ success: true, data: dynamic });
    }
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/risk/assess
 * Create/recalculate composite risk assessment
 */
milestone3Router.post('/v1/risk/assess', (req: Request, res: Response) => {
  try {
    const assessment = assessShipmentCompositeRisk(req.body);
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Alerts API Endpoints
// ==========================================

/**
 * GET /v1/alerts
 * List all weather & risk alerts
 */
milestone3Router.get('/v1/alerts', (req: Request, res: Response) => {
  try {
    const weatherAlerts = getAllWeatherAlerts();
    const riskAlerts = getAllRiskAlerts();
    return res.json({
      success: true,
      weatherAlerts,
      riskAlerts,
      totalCount: weatherAlerts.length + riskAlerts.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/alerts/:id/acknowledge
 * Acknowledge alert
 */
milestone3Router.post('/v1/alerts/:id/acknowledge', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req.body;
    const weatherAck = acknowledgeWeatherAlert(id);
    const riskAck = acknowledgeRiskAlert(id, user);

    if (!weatherAck && !riskAck) {
      return res.status(404).json({ error: 'Alert not found or already acknowledged' });
    }

    return res.json({ success: true, message: `Alert ${id} acknowledged successfully` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. ML Pricing API Endpoints
// ==========================================

/**
 * POST /v1/ml-pricing/predict
 * ML price prediction and comparison
 */
milestone3Router.post('/v1/ml-pricing/predict', (req: Request, res: Response) => {
  try {
    const { quoteId, ruleBasePriceInr, ruleBreakdown, ...features } = req.body;
    
    if (ruleBasePriceInr && ruleBreakdown) {
      const comparison = compareRuleVsMLPricing(
        quoteId || 'Q-SAMPLE',
        ruleBasePriceInr,
        ruleBreakdown,
        features
      );
      return res.json({ success: true, data: comparison });
    }

    const prediction = predictMLPrice(features);
    return res.json({ success: true, data: prediction });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/ml-pricing/models
 * Get ML model performance metrics MAE/RMSE/R2
 */
milestone3Router.get('/v1/ml-pricing/models', (req: Request, res: Response) => {
  try {
    const metrics = getMLModelEvaluationMetrics();
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. Data Freshness & Sync Logs
// ==========================================

milestone3Router.get('/v1/system/data-freshness', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_DATA_FRESHNESS });
});

milestone3Router.get('/v1/system/sync-logs', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_SYNC_LOGS });
});
