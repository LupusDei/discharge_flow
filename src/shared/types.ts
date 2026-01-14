// Shared types between client and server
// These will be expanded in later tasks

export interface Patient {
  id: string;
  name: string;
  dischargeDate: Date;
  dischargeDestination: string;
  riskLevel: 'standard' | 'high';
  assignedTo: string;
}

export type TaskType =
  | 'contact_patient'
  | 'medication_reconciliation'
  | 'followup_scheduling'
  | 'facility_handoff'
  | 'checkin_call';

export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Task {
  id: string;
  patientId: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date;
  completedBy?: string;
}
