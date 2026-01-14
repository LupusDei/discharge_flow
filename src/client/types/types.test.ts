import { describe, it, expect } from 'vitest';
import type { Patient, Task, TaskType, TaskStatus } from '@shared/types';

describe('Shared types', () => {
  it('Patient type has correct shape', () => {
    const patient: Patient = {
      id: '1',
      name: 'John Doe',
      dischargeDate: new Date(),
      dischargeDestination: 'Home',
      riskLevel: 'standard',
      assignedTo: 'assistant-1',
    };
    expect(patient.id).toBe('1');
    expect(patient.riskLevel).toBe('standard');
  });

  it('Task type has correct shape', () => {
    const task: Task = {
      id: '1',
      patientId: 'patient-1',
      type: 'contact_patient',
      status: 'pending',
      dueDate: new Date(),
    };
    expect(task.type).toBe('contact_patient');
    expect(task.status).toBe('pending');
  });

  it('TaskType includes all expected values', () => {
    const types: TaskType[] = [
      'contact_patient',
      'medication_reconciliation',
      'followup_scheduling',
      'facility_handoff',
      'checkin_call',
    ];
    expect(types).toHaveLength(5);
  });

  it('TaskStatus includes all expected values', () => {
    const statuses: TaskStatus[] = ['pending', 'completed', 'overdue'];
    expect(statuses).toHaveLength(3);
  });
});
