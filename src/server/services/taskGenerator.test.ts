import { describe, it, expect } from 'vitest';
import { Patient, Task } from '../../shared/types';
import {
  generateTaskId,
  getDischargeDateTime,
  generateTasksForPatient,
  generateTasksForPatients,
  calculateTaskStatus,
  isTaskOverdue,
  getTimeRemaining,
  getTimeRemainingFormatted,
  updateTaskStatuses,
  getOverdueTasks,
  getPendingTasks,
  getUpcomingTasks,
} from './taskGenerator';

const createTestPatient = (overrides: Partial<Patient> = {}): Patient => ({
  patientId: 'MRN0001',
  patientName: 'Test Patient',
  dob: '1980-01-01',
  gender: 'M',
  phone: '555-1234',
  email: 'test@example.com',
  preferredLanguage: 'English',
  admissionDate: '2026-01-10',
  dischargeDate: '2026-01-14',
  dischargeTime: '10:00',
  lengthOfStay: 4,
  primaryDiagnosis: 'Test Diagnosis',
  dischargeDisposition: 'Home',
  dischargeMedications: 'Med1, Med2',
  allergies: 'NKDA',
  attendingPhysician: 'Dr. Test',
  pcpName: 'Dr. Primary',
  pcpPhone: '555-5678',
  readmissionRiskScore: 'Low',
  fallRisk: 'Low',
  notes: null,
  ...overrides,
});

describe('TaskGenerator', () => {
  describe('generateTaskId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateTaskId();
      const id2 = generateTaskId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with task_ prefix', () => {
      const id = generateTaskId();
      expect(id.startsWith('task_')).toBe(true);
    });
  });

  describe('getDischargeDateTime', () => {
    it('should parse discharge date and time', () => {
      const patient = createTestPatient({
        dischargeDate: '2026-01-14',
        dischargeTime: '14:30',
      });

      const result = getDischargeDateTime(patient);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it('should default to 00:00 if no discharge time', () => {
      const patient = createTestPatient({
        dischargeDate: '2026-01-14',
        dischargeTime: null,
      });

      const result = getDischargeDateTime(patient);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('generateTasksForPatient', () => {
    it('should generate base tasks for all patients', () => {
      const patient = createTestPatient();
      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).toContain('contact_patient');
      expect(taskTypes).toContain('medication_reconciliation');
      expect(taskTypes).toContain('followup_scheduling');
    });

    it('should generate facility_handoff for SNF patients', () => {
      const patient = createTestPatient({
        dischargeDisposition: 'Skilled nursing facility',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).toContain('facility_handoff');
    });

    it('should NOT generate facility_handoff for non-SNF patients', () => {
      const patient = createTestPatient({
        dischargeDisposition: 'Home',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).not.toContain('facility_handoff');
    });

    it('should NOT generate facility_handoff for home health patients', () => {
      const patient = createTestPatient({
        dischargeDisposition: 'Home with home health',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).not.toContain('facility_handoff');
    });

    it('should generate checkin_call for High risk patients', () => {
      const patient = createTestPatient({
        readmissionRiskScore: 'High',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).toContain('checkin_call');
    });

    it('should generate checkin_call for Very High risk patients', () => {
      const patient = createTestPatient({
        readmissionRiskScore: 'Very High',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).toContain('checkin_call');
    });

    it('should NOT generate checkin_call for Medium risk patients', () => {
      const patient = createTestPatient({
        readmissionRiskScore: 'Medium',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).not.toContain('checkin_call');
    });

    it('should NOT generate checkin_call for Low risk patients', () => {
      const patient = createTestPatient({
        readmissionRiskScore: 'Low',
      });

      const tasks = generateTasksForPatient(patient);
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).not.toContain('checkin_call');
    });

    it('should set correct time windows for contact_patient (0-24hrs)', () => {
      const patient = createTestPatient({
        dischargeDate: '2026-01-14',
        dischargeTime: '10:00',
      });

      const tasks = generateTasksForPatient(patient);
      const contactTask = tasks.find((t) => t.type === 'contact_patient');

      expect(contactTask).toBeDefined();
      const dischargeTime = new Date('2026-01-14T10:00:00');
      expect(contactTask!.dueStart.getTime()).toBe(dischargeTime.getTime());
      expect(contactTask!.dueEnd.getTime()).toBe(dischargeTime.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should set correct time windows for medication_reconciliation (0-48hrs)', () => {
      const patient = createTestPatient({
        dischargeDate: '2026-01-14',
        dischargeTime: '10:00',
      });

      const tasks = generateTasksForPatient(patient);
      const medTask = tasks.find((t) => t.type === 'medication_reconciliation');

      expect(medTask).toBeDefined();
      const dischargeTime = new Date('2026-01-14T10:00:00');
      expect(medTask!.dueStart.getTime()).toBe(dischargeTime.getTime());
      expect(medTask!.dueEnd.getTime()).toBe(dischargeTime.getTime() + 48 * 60 * 60 * 1000);
    });

    it('should set correct time windows for checkin_call (48-72hrs)', () => {
      const patient = createTestPatient({
        dischargeDate: '2026-01-14',
        dischargeTime: '10:00',
        readmissionRiskScore: 'High',
      });

      const tasks = generateTasksForPatient(patient);
      const checkinTask = tasks.find((t) => t.type === 'checkin_call');

      expect(checkinTask).toBeDefined();
      const dischargeTime = new Date('2026-01-14T10:00:00');
      expect(checkinTask!.dueStart.getTime()).toBe(dischargeTime.getTime() + 48 * 60 * 60 * 1000);
      expect(checkinTask!.dueEnd.getTime()).toBe(dischargeTime.getTime() + 72 * 60 * 60 * 1000);
    });

    it('should set patientId on all generated tasks', () => {
      const patient = createTestPatient({ patientId: 'MRN1234' });
      const tasks = generateTasksForPatient(patient);

      expect(tasks.every((t) => t.patientId === 'MRN1234')).toBe(true);
    });

    it('should set status to pending on all generated tasks', () => {
      const patient = createTestPatient();
      const tasks = generateTasksForPatient(patient);

      expect(tasks.every((t) => t.status === 'pending')).toBe(true);
    });

    it('should generate unique IDs for each task', () => {
      const patient = createTestPatient({ readmissionRiskScore: 'High' });
      const tasks = generateTasksForPatient(patient);
      const ids = tasks.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('generateTasksForPatients', () => {
    it('should generate tasks for multiple patients', () => {
      const patients = [
        createTestPatient({ patientId: 'MRN0001' }),
        createTestPatient({ patientId: 'MRN0002' }),
      ];

      const tasks = generateTasksForPatients(patients);

      const patient1Tasks = tasks.filter((t) => t.patientId === 'MRN0001');
      const patient2Tasks = tasks.filter((t) => t.patientId === 'MRN0002');

      expect(patient1Tasks.length).toBeGreaterThan(0);
      expect(patient2Tasks.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty patient list', () => {
      const tasks = generateTasksForPatients([]);
      expect(tasks).toEqual([]);
    });
  });

  describe('calculateTaskStatus', () => {
    const createTestTask = (overrides: Partial<Task> = {}): Task => ({
      id: 'task_1',
      patientId: 'MRN0001',
      type: 'contact_patient',
      status: 'pending',
      dueStart: new Date('2026-01-14T10:00:00'),
      dueEnd: new Date('2026-01-15T10:00:00'),
      ...overrides,
    });

    it('should return completed for completed tasks', () => {
      const task = createTestTask({ status: 'completed' });
      const now = new Date('2026-01-14T12:00:00');
      expect(calculateTaskStatus(task, now)).toBe('completed');
    });

    it('should return upcoming when before dueStart', () => {
      const task = createTestTask({
        dueStart: new Date('2026-01-14T10:00:00'),
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-14T08:00:00'); // 2 hours before window
      expect(calculateTaskStatus(task, now)).toBe('upcoming');
    });

    it('should return pending when within time window', () => {
      const task = createTestTask({
        dueStart: new Date('2026-01-14T10:00:00'),
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-14T12:00:00'); // Within window
      expect(calculateTaskStatus(task, now)).toBe('pending');
    });

    it('should return overdue when after dueEnd', () => {
      const task = createTestTask({
        dueStart: new Date('2026-01-14T10:00:00'),
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-15T12:00:00'); // 2 hours after window
      expect(calculateTaskStatus(task, now)).toBe('overdue');
    });

    it('should handle checkin_call 48-72hr window correctly', () => {
      // Check-in call window: 48-72 hours after discharge
      const dischargeTime = new Date('2026-01-14T10:00:00');
      const task = createTestTask({
        type: 'checkin_call',
        dueStart: new Date(dischargeTime.getTime() + 48 * 60 * 60 * 1000),
        dueEnd: new Date(dischargeTime.getTime() + 72 * 60 * 60 * 1000),
      });

      // Before window (at 24 hours)
      const before = new Date(dischargeTime.getTime() + 24 * 60 * 60 * 1000);
      expect(calculateTaskStatus(task, before)).toBe('upcoming');

      // Within window (at 60 hours)
      const during = new Date(dischargeTime.getTime() + 60 * 60 * 60 * 1000);
      expect(calculateTaskStatus(task, during)).toBe('pending');

      // After window (at 80 hours)
      const after = new Date(dischargeTime.getTime() + 80 * 60 * 60 * 1000);
      expect(calculateTaskStatus(task, after)).toBe('overdue');
    });
  });

  describe('isTaskOverdue', () => {
    const createTestTask = (overrides: Partial<Task> = {}): Task => ({
      id: 'task_1',
      patientId: 'MRN0001',
      type: 'contact_patient',
      status: 'pending',
      dueStart: new Date('2026-01-14T10:00:00'),
      dueEnd: new Date('2026-01-15T10:00:00'),
      ...overrides,
    });

    it('should return true for overdue tasks', () => {
      const task = createTestTask();
      const now = new Date('2026-01-16T10:00:00');
      expect(isTaskOverdue(task, now)).toBe(true);
    });

    it('should return false for pending tasks', () => {
      const task = createTestTask();
      const now = new Date('2026-01-14T12:00:00');
      expect(isTaskOverdue(task, now)).toBe(false);
    });

    it('should return false for completed tasks', () => {
      const task = createTestTask({ status: 'completed' });
      const now = new Date('2026-01-16T10:00:00');
      expect(isTaskOverdue(task, now)).toBe(false);
    });
  });

  describe('getTimeRemaining', () => {
    const createTestTask = (overrides: Partial<Task> = {}): Task => ({
      id: 'task_1',
      patientId: 'MRN0001',
      type: 'contact_patient',
      status: 'pending',
      dueStart: new Date('2026-01-14T10:00:00'),
      dueEnd: new Date('2026-01-15T10:00:00'),
      ...overrides,
    });

    it('should return positive milliseconds when not overdue', () => {
      const task = createTestTask({
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-15T08:00:00'); // 2 hours before deadline
      const remaining = getTimeRemaining(task, now);
      expect(remaining).toBe(2 * 60 * 60 * 1000); // 2 hours in ms
    });

    it('should return negative milliseconds when overdue', () => {
      const task = createTestTask({
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-15T12:00:00'); // 2 hours after deadline
      const remaining = getTimeRemaining(task, now);
      expect(remaining).toBe(-2 * 60 * 60 * 1000); // -2 hours in ms
    });

    it('should return zero at exact deadline', () => {
      const task = createTestTask({
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-15T10:00:00');
      const remaining = getTimeRemaining(task, now);
      expect(remaining).toBe(0);
    });
  });

  describe('getTimeRemainingFormatted', () => {
    const createTestTask = (overrides: Partial<Task> = {}): Task => ({
      id: 'task_1',
      patientId: 'MRN0001',
      type: 'contact_patient',
      status: 'pending',
      dueStart: new Date('2026-01-14T10:00:00'),
      dueEnd: new Date('2026-01-15T10:00:00'),
      ...overrides,
    });

    it('should format time remaining correctly', () => {
      const task = createTestTask({
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-15T07:30:00'); // 2.5 hours before deadline

      const result = getTimeRemainingFormatted(task, now);

      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(30);
      expect(result.isOverdue).toBe(false);
      expect(result.totalMinutes).toBe(150);
    });

    it('should format overdue time correctly', () => {
      const task = createTestTask({
        dueEnd: new Date('2026-01-15T10:00:00'),
      });
      const now = new Date('2026-01-15T11:30:00'); // 1.5 hours after deadline

      const result = getTimeRemainingFormatted(task, now);

      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(30);
      expect(result.isOverdue).toBe(true);
      expect(result.totalMinutes).toBe(90);
    });
  });

  describe('updateTaskStatuses', () => {
    it('should update statuses based on current time', () => {
      const tasks: Task[] = [
        {
          id: 'task_1',
          patientId: 'MRN0001',
          type: 'contact_patient',
          status: 'pending',
          dueStart: new Date('2026-01-14T10:00:00'),
          dueEnd: new Date('2026-01-15T10:00:00'),
        },
        {
          id: 'task_2',
          patientId: 'MRN0001',
          type: 'medication_reconciliation',
          status: 'pending',
          dueStart: new Date('2026-01-16T10:00:00'),
          dueEnd: new Date('2026-01-17T10:00:00'),
        },
      ];

      const now = new Date('2026-01-14T12:00:00');
      const updated = updateTaskStatuses(tasks, now);

      expect(updated[0].status).toBe('pending'); // Within window
      expect(updated[1].status).toBe('upcoming'); // Window not yet open
    });
  });

  describe('getOverdueTasks', () => {
    it('should return only overdue tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task_1',
          patientId: 'MRN0001',
          type: 'contact_patient',
          status: 'pending',
          dueStart: new Date('2026-01-13T10:00:00'),
          dueEnd: new Date('2026-01-14T10:00:00'),
        },
        {
          id: 'task_2',
          patientId: 'MRN0001',
          type: 'medication_reconciliation',
          status: 'pending',
          dueStart: new Date('2026-01-14T10:00:00'),
          dueEnd: new Date('2026-01-15T10:00:00'),
        },
      ];

      const now = new Date('2026-01-14T12:00:00');
      const overdue = getOverdueTasks(tasks, now);

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('task_1');
    });
  });

  describe('getPendingTasks', () => {
    it('should return only pending tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task_1',
          patientId: 'MRN0001',
          type: 'contact_patient',
          status: 'pending',
          dueStart: new Date('2026-01-14T10:00:00'),
          dueEnd: new Date('2026-01-15T10:00:00'),
        },
        {
          id: 'task_2',
          patientId: 'MRN0001',
          type: 'medication_reconciliation',
          status: 'pending',
          dueStart: new Date('2026-01-16T10:00:00'),
          dueEnd: new Date('2026-01-17T10:00:00'),
        },
      ];

      const now = new Date('2026-01-14T12:00:00');
      const pending = getPendingTasks(tasks, now);

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('task_1');
    });
  });

  describe('getUpcomingTasks', () => {
    it('should return only upcoming tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task_1',
          patientId: 'MRN0001',
          type: 'contact_patient',
          status: 'pending',
          dueStart: new Date('2026-01-14T10:00:00'),
          dueEnd: new Date('2026-01-15T10:00:00'),
        },
        {
          id: 'task_2',
          patientId: 'MRN0001',
          type: 'checkin_call',
          status: 'pending',
          dueStart: new Date('2026-01-16T10:00:00'),
          dueEnd: new Date('2026-01-17T10:00:00'),
        },
      ];

      const now = new Date('2026-01-14T12:00:00');
      const upcoming = getUpcomingTasks(tasks, now);

      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].id).toBe('task_2');
    });
  });
});
