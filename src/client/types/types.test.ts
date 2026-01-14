import { describe, it, expect } from 'vitest';
import type { Patient, Task, TaskType, TaskStatus } from '@shared/types';

describe('Shared types', () => {
  it('Patient type has correct shape', () => {
    const patient: Patient = {
      patientId: '1',
      patientName: 'John Doe',
      dob: '1950-01-01',
      gender: 'M',
      phone: '555-1234',
      email: 'john@example.com',
      preferredLanguage: 'English',
      admissionDate: '2024-01-01',
      dischargeDate: '2024-01-05',
      dischargeTime: '14:00',
      lengthOfStay: 4,
      primaryDiagnosis: 'Pneumonia',
      dischargeDisposition: 'Home',
      dischargeMedications: 'Amoxicillin',
      allergies: 'NKDA',
      attendingPhysician: 'Dr. Smith',
      pcpName: 'Dr. Jones',
      pcpPhone: '555-5678',
      readmissionRiskScore: 'Low',
      fallRisk: 'Low',
      notes: null,
    };
    expect(patient.patientId).toBe('1');
    expect(patient.readmissionRiskScore).toBe('Low');
  });

  it('Task type has correct shape', () => {
    const task: Task = {
      id: '1',
      patientId: 'patient-1',
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
