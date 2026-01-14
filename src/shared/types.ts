// Shared types between client and server

// =============================================================================
// Enums and Union Types
// =============================================================================

export type DischargeDisposition =
  | 'Home'
  | 'Home with home health'
  | 'Skilled nursing facility';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';

export type TaskType =
  | 'contact_patient'
  | 'medication_reconciliation'
  | 'followup_scheduling'
  | 'facility_handoff'
  | 'checkin_call';

export type TaskStatus = 'pending' | 'completed' | 'overdue' | 'upcoming';

// =============================================================================
// Patient
// =============================================================================

export interface Patient {
  // Identifiers
  patientId: string;              // MRN (Medical Record Number)
  patientName: string;

  // Demographics
  dob: string;                    // Date of birth (YYYY-MM-DD)
  gender: 'M' | 'F';
  phone: string | null;           // May be empty
  email: string | null;           // May be empty
  preferredLanguage: string;      // English, Spanish, Korean, Mandarin, etc.

  // Admission/Discharge
  admissionDate: string;          // YYYY-MM-DD
  dischargeDate: string;          // YYYY-MM-DD - Key for task timing
  dischargeTime: string | null;   // HH:MM - May be empty
  lengthOfStay: number;           // Days

  // Clinical
  primaryDiagnosis: string;
  dischargeDisposition: DischargeDisposition;
  dischargeMedications: string;   // Comma-separated list
  allergies: string | null;       // NKDA = No Known Drug Allergies, or null

  // Care Team
  attendingPhysician: string;
  pcpName: string | null;         // Primary care physician - may be empty
  pcpPhone: string | null;        // May be empty

  // Risk Assessment
  readmissionRiskScore: RiskLevel;
  fallRisk: RiskLevel | null;     // May be empty

  // Other
  notes: string | null;           // Free text notes
}

// =============================================================================
// Task
// =============================================================================

export interface Task {
  id: string;
  patientId: string;
  type: TaskType;
  status: TaskStatus;
  dueStart: Date;                 // When task window opens
  dueEnd: Date;                   // When task window closes (deadline)
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

// =============================================================================
// Task Generation Rules
// =============================================================================

export interface TaskRule {
  type: TaskType;
  label: string;                  // Human-readable task name
  windowStartHours: number;       // Hours after discharge when window opens
  windowEndHours: number;         // Hours after discharge when window closes
  condition: (patient: Patient) => boolean;
}

export const TASK_RULES: TaskRule[] = [
  {
    type: 'contact_patient',
    label: 'Contact Patient',
    windowStartHours: 0,
    windowEndHours: 24,
    condition: () => true,  // All patients
  },
  {
    type: 'medication_reconciliation',
    label: 'Medication Reconciliation',
    windowStartHours: 0,
    windowEndHours: 48,
    condition: () => true,  // All patients
  },
  {
    type: 'followup_scheduling',
    label: 'Confirm Followup Scheduling',
    windowStartHours: 0,
    windowEndHours: 48,
    condition: () => true,  // All patients
  },
  {
    type: 'facility_handoff',
    label: 'Facility Handoff Confirmation',
    windowStartHours: 0,
    windowEndHours: 24,
    condition: (patient) => patient.dischargeDisposition === 'Skilled nursing facility',
  },
  {
    type: 'checkin_call',
    label: '48hr Check-in Call',
    windowStartHours: 48,
    windowEndHours: 72,
    condition: (patient) => ['High', 'Very High'].includes(patient.readmissionRiskScore),
  },
];

// =============================================================================
// API Response Types
// =============================================================================

export interface PatientWithTasks extends Patient {
  tasks: Task[];
}

export interface DashboardStats {
  totalPatients: number;
  pendingTasks: number;
  overdueTasks: number;
  completedToday: number;
}
