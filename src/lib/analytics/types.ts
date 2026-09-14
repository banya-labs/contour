export type ReportPeriod = {
  from: string; // ISO YYYY-MM-DD
  to: string;   // ISO YYYY-MM-DD
  label: string;
  days: number;
};

export type KpiComparison = {
  label: string;
  current: number;
  previous: number;
  changePct: number;
  trend: "UP" | "DOWN" | "FLAT";
  format?: "NUMBER" | "CURRENCY" | "PERCENT";
};

export type ExecutiveKpiSet = {
  totalProperties: number;
  activeProperties: number;
  newPropertiesAdded: number;
  propertiesSold: number;
  propertiesRented: number;
  newClients: number;
  newInquiries: number;
  matchedInquiries: number;
  unmatchedInquiries: number;
  partiallyMatched: number;
  viewingsScheduled: number;
  viewingsCompleted: number;
  activeNegotiations: number;
  offersReceived: number;
  completedTransactions: number;
  failedDeals: number;
  followUpsDue: number;
  outstandingTasks: number;
};

export type FinancialKpis = {
  totalTransactionValue: number;
  companyCommission: number;
  agentCommissions: number;
  netCompanyCommission: number;
  outstandingRentalPayments: number;
  currency: string;
};

export type PropertyPortfolioItem = {
  id: string;
  title: string;
  location: string;
  type: string;
  price: number;
  currency: string;
  listingType: string;
  agentAssigned: string;
  status: string;
  createdAt: string;
};

export type PropertyPerformanceItem = {
  id: string;
  title: string;
  suburb: string;
  inquiries: number;
  viewings: number;
  negotiations: number;
  offers: number;
  status: string;
  price: number;
  currency: string;
};

export type ClientInquiryItem = {
  id: string;
  date: string;
  clientName: string;
  clientPhone: string;
  requirement: string;
  location: string;
  budget: number;
  currency: string;
  status: string;
  matchStatus: string;
  agent: string;
};

export type DemandCount = {
  name: string;
  inquiries: number;
  percentage: number;
};

export type UnmatchedInquiryItem = {
  id: string;
  clientName: string;
  clientPhone: string;
  requirement: string;
  location: string;
  budget: number;
  currency: string;
  daysWaiting: number;
  reason: string;
  agent: string;
};

export type ViewingPerformanceSnapshot = {
  scheduled: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
  completionRatePct: number;
  viewingToNegotiationPct: number;
};

export type PipelineStageSnapshot = {
  stage: string;
  label: string;
  opportunities: number;
  potentialValue: number;
  currency: string;
};

export type CompletedTransactionItem = {
  id: string;
  client: string;
  property: string;
  suburb: string;
  agent: string;
  transactionType: string;
  value: number;
  commission: number;
  agentCommission: number;
  currency: string;
  closedAt: string;
};

export type LostDealItem = {
  id: string;
  client: string;
  property: string;
  agent: string;
  failedAt: string;
  potentialValue: number;
  currency: string;
  reason: string;
};

export type AgentPerformanceItem = {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  inquiries: number;
  matches: number;
  viewings: number;
  negotiations: number;
  offers: number;
  completed: number;
  lost: number;
  followUpsCompleted: number;
  activeDays: number;
  lastActivity: string | null;
  outstandingFollowUps: number;
  activityStatus: "ACTIVE" | "MONITOR" | "INACTIVE";
  conversionRatePct: number;
  grossCommissionGenerated: number;
  currency: string;
};

export type LeadSourceItem = {
  source: string;
  inquiries: number;
  matches: number;
  viewings: number;
  deals: number;
  completed: number;
  conversionRatePct: number;
};

export type ArrearsTenantItem = {
  leaseId: string;
  tenantName: string;
  tenantPhone: string;
  property: string;
  amountDue: number;
  currency: string;
  daysOverdue: number;
};

export type RentalPerformanceSnapshot = {
  rentalPropertiesCount: number;
  occupiedCount: number;
  vacantCount: number;
  occupancyRatePct: number;
  monthlyRentalValue: number;
  collected: number;
  outstanding: number;
  currency: string;
  tenantsInArrearsCount: number;
  activeArrears: ArrearsTenantItem[];
};

export type StalePropertyItem = {
  id: string;
  title: string;
  suburb: string;
  daysListed: number;
  inquiries: number;
  viewings: number;
  negotiations: number;
  price: number;
  currency: string;
  recommendation: string;
};

export type DocumentActivityItem = {
  date: string;
  user: string;
  activity: string;
  docType: string;
  fileName: string;
};

export type DocumentActivitySnapshot = {
  newDocumentsUploaded: number;
  byCategory: Record<string, number>;
  documentsUpdated: number;
  recentActivities: DocumentActivityItem[];
};

export type WorkQueueAlert = {
  id: string;
  severity: "RED" | "AMBER" | "BLUE";
  title: string;
  count: number;
  detail: string;
  actionHref: string;
};

export type ContourReportPayload = {
  meta: {
    companyName: string;
    logoUrl: string | null;
    primaryAddress: string | null;
    primaryPhone: string | null;
    primaryEmail: string | null;
    currency: string;
    generatedAt: string;
    preparedBy: string;
    reportType: string;
  };
  period: ReportPeriod;
  previousPeriod: ReportPeriod;

  // 1 & 2: Executive Summary & Management Snapshot
  executiveKpis: ExecutiveKpiSet;
  financialKpis: FinancialKpis;
  overallBusinessStatus: "GOOD" | "STABLE" | "ATTENTION_REQUIRED";
  managementAttentionRequired: string[];

  // 3 & 4: Property Portfolio & Performance
  portfolioSummary: {
    forSale: number;
    forRent: number;
    underNegotiation: number;
    sold: number;
    rented: number;
    total: number;
  };
  newPropertiesAdded: PropertyPortfolioItem[];
  topPerformanceProperties: PropertyPerformanceItem[];
  highestDemandProperty: PropertyPerformanceItem | null;

  // 6 & 7: Inquiries & Demand Analysis
  recentInquiries: ClientInquiryItem[];
  demandByPropertyType: DemandCount[];
  demandByLocation: DemandCount[];
  demandInsight: string;

  // 8 & 9: Property Matching & Unmatched Queue
  matching: {
    totalInquiries: number;
    fullyMatched: number;
    partiallyMatched: number;
    unmatched: number;
    matchRatePct: number;
  };
  unmatchedQueue: UnmatchedInquiryItem[];

  // 10: Viewing Performance
  viewings: ViewingPerformanceSnapshot;

  // 11: Sales & Deal Pipeline Funnel
  pipelineFunnel: {
    stages: PipelineStageSnapshot[];
    totalActivePipelineValue: number;
    currency: string;
  };

  // 12 & 13: Completed Transactions & Lost Deals
  completedTransactions: CompletedTransactionItem[];
  lostDealsSummary: {
    totalDealsLost: number;
    totalPotentialValueLost: number;
    currency: string;
    failureStages: { stage: string; deals: number; percentage: number }[];
    mainReasons: { reason: string; deals: number }[];
    deals: LostDealItem[];
  };

  // 14, 15, 16: Agent Performance
  agentPerformance: AgentPerformanceItem[];

  // 17: Lead Source Performance
  leadSourcePerformance: LeadSourceItem[];
  highestPerformingLeadSource: string | null;

  // 18: Rental Performance
  rentalPerformance: RentalPerformanceSnapshot;

  // 19: Commission & Revenue Breakdown
  commissionSummary: {
    totalTransactionValue: number;
    grossCommission: number;
    agentCommission: number;
    netCompanyCommission: number;
    currency: string;
    byAgent: { agentName: string; grossCommission: number }[];
  };

  // 20: Work Queue
  workQueue: {
    alerts: WorkQueueAlert[];
    priorityActions: string[];
  };

  // 21: Old / Underperforming Properties (>90 days)
  staleProperties: StalePropertyItem[];

  // 22: Document Activity
  documentActivity: DocumentActivitySnapshot;

  // 23: Month-on-Month Performance
  momComparison: KpiComparison[];

  // 26: Business at a Glance
  atAGlance: {
    newInquiries: number;
    matchedClients: number;
    unmatchedClients: number;
    completedViewings: number;
    negotiations: number;
    offers: number;
    completedTransactions: number;
    failedDeals: number;
    grossCommission: number;
    potentialValueLost: number;
    activePipeline: number;
    currency: string;
  };

  // 24, 25, 27: AI-synthesized narrative sections (initialized with deterministic defaults, enriched via AI route)
  aiNarrative: {
    executiveSummaryText: string;
    whatIsWorking: string[];
    whatNeedsAttention: string[];
    actionPlan: {
      immediatePriority1: string[];
      thisWeekPriority2: string[];
      nextMonthPriority3: string[];
    };
    conclusionText: string;
  };
};
