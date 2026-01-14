import { Patient, Task, TASK_RULES } from '../../shared/types';

/**
 * Generate a unique ID for tasks
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate the discharge datetime from patient data.
 * Uses dischargeDate and dischargeTime (defaults to 00:00 if no time provided).
 */
export function getDischargeDateTime(patient: Patient): Date {
  const dateStr = patient.dischargeDate;
  const timeStr = patient.dischargeTime || '00:00';
  return new Date(`${dateStr}T${timeStr}:00`);
}

/**
 * Generate tasks for a patient based on TASK_RULES.
 *
 * Task generation rules:
 * - contact_patient: 0-24hrs after discharge (all patients)
 * - medication_reconciliation: 0-48hrs (all patients)
 * - followup_scheduling: 0-48hrs (all patients)
 * - facility_handoff: 0-24hrs (only if dischargeDisposition === 'Skilled nursing facility')
 * - checkin_call: 48-72hrs (only if readmissionRiskScore in ['High', 'Very High'])
 */
export function generateTasksForPatient(patient: Patient): Task[] {
  const dischargeDateTime = getDischargeDateTime(patient);
  const tasks: Task[] = [];

  for (const rule of TASK_RULES) {
    if (!rule.condition(patient)) {
      continue;
    }

    const dueStart = new Date(dischargeDateTime.getTime() + rule.windowStartHours * 60 * 60 * 1000);
    const dueEnd = new Date(dischargeDateTime.getTime() + rule.windowEndHours * 60 * 60 * 1000);

    tasks.push({
      id: generateTaskId(),
      patientId: patient.patientId,
      type: rule.type,
      status: 'pending',
      dueStart,
      dueEnd,
    });
  }

  return tasks;
}

/**
 * Generate tasks for multiple patients.
 */
export function generateTasksForPatients(patients: Patient[]): Task[] {
  const allTasks: Task[] = [];
  for (const patient of patients) {
    allTasks.push(...generateTasksForPatient(patient));
  }
  return allTasks;
}
