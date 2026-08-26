import express from "express";
import { tariffRouter } from "./routes/tariffs";
import { quoteRouter } from "./routes/quotes";
import { feedbackRouter } from "./routes/feedback";
import masterDataRouter from "./routes/masterData";
import { milestone3Router } from "./routes/milestone3Routes";

export const app = express();

app.use(express.json());

// Enable CORS for Vercel & cross-origin deployment
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "FreightQuote AI - Risk, Weather & Customs Engine" });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "FreightQuote AI - Risk, Weather & Customs Engine" });
});

// Mount Routers for Tariff, Quote & Master Data Endpoints
app.use("/api", tariffRouter);
app.use("/api", quoteRouter);
app.use("/", tariffRouter);
app.use("/", quoteRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/feedback", feedbackRouter);
app.use("/api/v1/master-data", masterDataRouter);
app.use("/v1/master-data", masterDataRouter);

// Risk, Customs & Weather Intelligence Routes
app.use("/api", milestone3Router);
app.use("/", milestone3Router);

