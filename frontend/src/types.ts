
export enum ComplianceStatus {
  OK = 'OK',
  WARN = 'WARN',
  FAIL = 'FAIL'
}

export interface ChecklistItem {
  item_title: string;
  status: ComplianceStatus;
  why_it_matters: string;
  required_action: string;
  legal_basis: string; // 추가: 법적 근거 (예: 산업안전보건법 제38조)
  evidence: string[];
}

export interface RiskAssessment {
  overview: string;
  hazards: string[];
  measures: string[];
  residual_risk: string;
  legal_basis: string[];
}

export interface ComplianceEvaluation {
  applied_laws: string[];
  summary: string;
  improvements: string[];
  legal_basis: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  scenario: ScenarioInput;
  checklist: ChecklistItem[];
  risk_assessment: RiskAssessment;
  compliance_evaluation: ComplianceEvaluation;
  summary_stats: {
    total_items: number;
    fail_count: number;
    warn_count: number;
    top_3_actions: string[];
  };
}

export interface ScenarioInput {
  work_type: string;
  workforce: string;
  equipment: string;
  environment: string;
  optional_text: string;
}

export interface LegalChunk {
  doc_title: string;
  doc_type: string;
  clause_path: string;
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  legalBasis?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  legal_ref: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  legal_example: string;
  industrial_significance: string;
  category: '중대재해처벌법' | '산업안전보건법' | 'ISO 45001';
}
