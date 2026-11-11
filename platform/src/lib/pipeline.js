/* Stage-gated pipeline model — mirrors the guidelines' workflow:
   screening → evaluation → selection → award, with feedback at every gate. */

export const STAGES = [
  'draft',
  'submitted',
  'compliance_review',
  'screened_in',
  'screened_out',
  'in_evaluation',
  'selection',
  'awarded',
  'not_selected',
];

export const STAGE_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  compliance_review: 'Compliance Review',
  screened_in: 'Screened In',
  screened_out: 'Screened Out',
  in_evaluation: 'In Evaluation',
  selection: 'Final Selection',
  awarded: 'Awarded',
  not_selected: 'Not Selected',
};

// Stage colours follow the semantic scale (see lib/semantics.js):
// grey = not submitted yet, blue = with CEDA, orange = moving through a gate,
// amber = a decision is due, green = awarded, red = out.
export const STAGE_COLORS = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  submitted: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  compliance_review: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  screened_in: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300',
  screened_out: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  in_evaluation: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300',
  selection: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  awarded: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  not_selected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

// Gate actions an admin can take from a given stage: [targetStage, gate, decision]
export const GATE_ACTIONS = {
  submitted: [
    { label: 'Pass compliance → screen in', to: 'screened_in', gate: 'screening', decision: 'passed' },
    { label: 'Fail screening', to: 'screened_out', gate: 'screening', decision: 'failed' },
    { label: 'Send to compliance review', to: 'compliance_review', gate: 'compliance', decision: 'passed' },
  ],
  compliance_review: [
    { label: 'Pass compliance → screen in', to: 'screened_in', gate: 'screening', decision: 'passed' },
    { label: 'Fail screening', to: 'screened_out', gate: 'screening', decision: 'failed' },
  ],
  screened_in: [
    { label: 'Open for evaluation', to: 'in_evaluation', gate: 'evaluation', decision: 'opened' },
  ],
  in_evaluation: [
    { label: 'Advance to final selection', to: 'selection', gate: 'selection', decision: 'passed' },
  ],
  selection: [
    { label: 'Award', to: 'awarded', gate: 'award', decision: 'passed' },
    { label: 'Not selected', to: 'not_selected', gate: 'award', decision: 'failed' },
  ],
};

// Judging rubric — 5 criteria, 0–10 each, equal weights.
export const RUBRIC = [
  { key: 'innovation', label: 'Innovation & Originality' },
  { key: 'feasibility', label: 'Feasibility & Scalability' },
  { key: 'impact', label: 'SDG Impact' },
  { key: 'viability', label: 'Commercial Viability' },
  { key: 'team', label: 'Team Capability' },
];

export const MAX_TOTAL = RUBRIC.length * 10;
