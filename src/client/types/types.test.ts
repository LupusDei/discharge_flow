import { describe, it, expect } from 'vitest';
import type { Patient, Task, TaskType, TaskStatus } from '@shared/types';

describe('Shared types', () => {
  it('Patient type has correct shape', () => {
    const patient: Patient = {
      patientId: 'MRN001',
      patientName: 'John Doe',
      dob: '1960-05-15',
      gender: 'M',
      phone: '555-1234',
      email: 'john@test.com',
      preferredLanguage: 'English',
      admissionDate: '2026-01-01',
      dischargeDate: '2026-01-05',
      dischargeTime: '10:30',
      lengthOfStay: 4,
      primaryDiagnosis: 'Heart failure',
      dischargeDisposition: 'Home',
      dischargeMedications: 'Medication A',
      allergies: 'Penicillin',
      attendingPhysician: 'Dr. Smith',
      pcpName: 'Dr. Jones',
      pcpPhone: '555-5678',
      readmissionRiskScore: 'High',
      fallRisk: 'Low',
      notes: 'Test notes',
    };
    expect(patient.patientId).toBe('MRN001');
    expect(patient.readmissionRiskScore).toBe('High');
  });

  it('Task type has correct shape', () => {
    const task: Task = {
      id: '1',
      patientId: 'MRN001',
      type: 'contact_patient',
      status: 'pending',
      dueStart: new Date(),
      dueEnd: new Date(),
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
    const statuses: TaskStatus[] = ['pending', 'completed', 'overdue', 'upcoming'];
    expect(statuses).toHaveLength(4);
  });
});
