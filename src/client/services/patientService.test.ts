import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeDatabase,
  resetDatabase,
  getAllPatients,
  getPatientById,
  searchPatientsByName,
  getAllTasks,
  getTasksByPatientId,
  completeTask,
  addTaskNote,
  getDashboardStats,
} from './patientService';
import { SEED_PATIENTS } from './seedData';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Patient Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('initializeDatabase', () => {
    it('should seed patients on first call', () => {
      initializeDatabase();
      const patients = getAllPatients();
      expect(patients).toHaveLength(SEED_PATIENTS.length);
    });

    it('should not reseed if already initialized', () => {
      initializeDatabase();
      const initialPatients = getAllPatients();

      // Call again
      initializeDatabase();
      const patientsAfter = getAllPatients();

      expect(patientsAfter).toEqual(initialPatients);
    });
  });

  describe('resetDatabase', () => {
    it('should reset to initial seed state', () => {
      initializeDatabase();

      // Complete a task to modify state
      const tasks = getAllTasks();
      if (tasks.length > 0) {
        completeTask(tasks[0].id, 'test-user');
      }

      // Reset
      resetDatabase();

      // All tasks should be pending again
      const tasksAfterReset = getAllTasks();
      const completedTasks = tasksAfterReset.filter((t) => t.status === 'completed');
      expect(completedTasks).toHaveLength(0);
    });
  });

  describe('Patient Operations', () => {
    beforeEach(() => {
      initializeDatabase();
    });

    it('getAllPatients should return all seed patients', () => {
      const patients = getAllPatients();
      expect(patients).toHaveLength(15);
    });

    it('getPatientById should return correct patient', () => {
      const patient = getPatientById('MRN8472');
      expect(patient).not.toBeNull();
      expect(patient?.patientName).toBe('Maria Garcia');
    });

    it('getPatientById should return null for non-existent ID', () => {
      const patient = getPatientById('NON_EXISTENT');
      expect(patient).toBeNull();
    });

    it('searchPatientsByName should find matching patients', () => {
      const results = searchPatientsByName('garcia');
      expect(results).toHaveLength(1);
      expect(results[0].patientName).toBe('Maria Garcia');
    });

    it('searchPatientsByName should be case insensitive', () => {
      const results = searchPatientsByName('MARIA');
      expect(results).toHaveLength(1);
    });

    it('searchPatientsByName should return empty for no matches', () => {
      const results = searchPatientsByName('xyz123');
      expect(results).toHaveLength(0);
    });
  });

  describe('Task Operations', () => {
    beforeEach(() => {
      initializeDatabase();
    });

    it('getAllTasks should return tasks for all patients', () => {
      const tasks = getAllTasks();
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should generate correct task types for SNF patients', () => {
      // Jennifer Brown (MRN4419) is discharged to SNF
      const tasks = getTasksByPatientId('MRN4419');
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).toContain('facility_handoff');
      expect(taskTypes).toContain('contact_patient');
    });

    it('should generate checkin_call for high-risk patients', () => {
      // David Park (MRN9382) is Very High risk
      const tasks = getTasksByPatientId('MRN9382');
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).toContain('checkin_call');
    });

    it('should NOT generate checkin_call for low-risk patients', () => {
      // James Wilson (MRN3391) is Low risk
      const tasks = getTasksByPatientId('MRN3391');
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).not.toContain('checkin_call');
    });

    it('should NOT generate facility_handoff for non-SNF patients', () => {
      // Maria Garcia (MRN8472) is discharged Home with home health
      const tasks = getTasksByPatientId('MRN8472');
      const taskTypes = tasks.map((t) => t.type);

      expect(taskTypes).not.toContain('facility_handoff');
    });

    it('getTasksByPatientId should return only tasks for that patient', () => {
      const tasks = getTasksByPatientId('MRN8472');
      expect(tasks.every((t) => t.patientId === 'MRN8472')).toBe(true);
    });

    it('completeTask should mark task as completed', () => {
      const tasks = getAllTasks();
      const taskToComplete = tasks[0];

      const result = completeTask(taskToComplete.id, 'test-user');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('completed');
      expect(result?.completedBy).toBe('test-user');
      expect(result?.completedAt).toBeInstanceOf(Date);
    });

    it('completeTask should return null for non-existent task', () => {
      const result = completeTask('non-existent-id');
      expect(result).toBeNull();
    });

    it('addTaskNote should add note to task', () => {
      const tasks = getAllTasks();
      const task = tasks[0];

      const result = addTaskNote(task.id, 'Test note');

      expect(result).not.toBeNull();
      expect(result?.notes).toBe('Test note');
    });
  });

  describe('Dashboard Statistics', () => {
    beforeEach(() => {
      initializeDatabase();
    });

    it('getDashboardStats should return correct patient count', () => {
      const stats = getDashboardStats();
      expect(stats.totalPatients).toBe(15);
    });

    it('getDashboardStats should count tasks correctly', () => {
      const stats = getDashboardStats();
      expect(stats.pendingTasks + stats.overdueTasks).toBeGreaterThan(0);
    });

    it('getDashboardStats should update after completing task', () => {
      const statsBefore = getDashboardStats();
      const tasks = getAllTasks();
      const pendingTask = tasks.find((t) => t.status === 'pending' || t.status === 'overdue');

      if (pendingTask) {
        completeTask(pendingTask.id);
        const statsAfter = getDashboardStats();
        expect(statsAfter.completedToday).toBe(statsBefore.completedToday + 1);
      }
    });
  });

  describe('Task Status Calculation', () => {
    beforeEach(() => {
      initializeDatabase();
    });

    it('tasks should have Date objects for dueStart and dueEnd', () => {
      const tasks = getAllTasks();
      expect(tasks[0].dueStart).toBeInstanceOf(Date);
      expect(tasks[0].dueEnd).toBeInstanceOf(Date);
    });
  });
});
