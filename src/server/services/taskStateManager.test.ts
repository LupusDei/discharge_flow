import { describe, it, expect, beforeEach } from 'vitest';
import { Task } from '../../shared/types';
import {
  isValidTransition,
  canCompleteTask,
  completeTask,
  addTaskNotes,
  findTaskById,
  completeTaskInCollection,
  addNotesToTaskInCollection,
  serializeTasksForStorage,
  deserializeTasksFromStorage,
  TaskStore,
} from './taskStateManager';

const createTestTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task_test_123',
  patientId: 'MRN0001',
  type: 'contact_patient',
  status: 'pending',
  dueStart: new Date('2026-01-14T10:00:00'),
  dueEnd: new Date('2026-01-15T10:00:00'),
  ...overrides,
});

describe('TaskStateManager', () => {
  describe('isValidTransition', () => {
    it('should allow pending to completed', () => {
      expect(isValidTransition('pending', 'completed')).toBe(true);
    });

    it('should allow overdue to completed', () => {
      expect(isValidTransition('overdue', 'completed')).toBe(true);
    });

    it('should allow pending to overdue', () => {
      expect(isValidTransition('pending', 'overdue')).toBe(true);
    });

    it('should not allow completed to any other status', () => {
      expect(isValidTransition('completed', 'pending')).toBe(false);
      expect(isValidTransition('completed', 'overdue')).toBe(false);
      expect(isValidTransition('completed', 'upcoming')).toBe(false);
    });

    it('should not allow upcoming to completed directly', () => {
      expect(isValidTransition('upcoming', 'completed')).toBe(false);
    });
  });

  describe('canCompleteTask', () => {
    it('should return true for pending task', () => {
      const now = new Date('2026-01-14T12:00:00');
      const task = createTestTask({ status: 'pending' });
      expect(canCompleteTask(task, now)).toBe(true);
    });

    it('should return true for overdue task', () => {
      const now = new Date('2026-01-16T12:00:00'); // After dueEnd
      const task = createTestTask({ status: 'pending' });
      expect(canCompleteTask(task, now)).toBe(true);
    });

    it('should return false for completed task', () => {
      const task = createTestTask({ status: 'completed' });
      expect(canCompleteTask(task)).toBe(false);
    });

    it('should return false for upcoming task', () => {
      const now = new Date('2026-01-14T08:00:00'); // Before dueStart
      const task = createTestTask({ status: 'pending' });
      expect(canCompleteTask(task, now)).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('should complete a pending task', () => {
      const now = new Date('2026-01-14T12:00:00');
      const task = createTestTask({ status: 'pending' });

      const result = completeTask(task, 'Nurse Smith', now);

      expect(result.success).toBe(true);
      expect(result.task?.status).toBe('completed');
      expect(result.task?.completedAt).toEqual(now);
      expect(result.task?.completedBy).toBe('Nurse Smith');
    });

    it('should complete an overdue task', () => {
      const now = new Date('2026-01-16T12:00:00');
      const task = createTestTask({ status: 'pending' });

      const result = completeTask(task, 'Nurse Smith', now);

      expect(result.success).toBe(true);
      expect(result.task?.status).toBe('completed');
    });

    it('should fail for already completed task', () => {
      const task = createTestTask({ status: 'completed' });

      const result = completeTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task is already completed');
    });

    it('should fail for upcoming task', () => {
      const now = new Date('2026-01-14T08:00:00');
      const task = createTestTask({ status: 'pending' });

      const result = completeTask(task, undefined, now);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot complete a task before its window opens');
    });

    it('should work without completedBy', () => {
      const now = new Date('2026-01-14T12:00:00');
      const task = createTestTask({ status: 'pending' });

      const result = completeTask(task, undefined, now);

      expect(result.success).toBe(true);
      expect(result.task?.completedBy).toBeUndefined();
    });
  });

  describe('addTaskNotes', () => {
    it('should add notes to a task', () => {
      const task = createTestTask();
      const result = addTaskNotes(task, 'Called patient, left voicemail');

      expect(result.notes).toBe('Called patient, left voicemail');
      expect(result.id).toBe(task.id);
    });

    it('should not modify the original task', () => {
      const task = createTestTask();
      addTaskNotes(task, 'Test notes');

      expect(task.notes).toBeUndefined();
    });
  });

  describe('findTaskById', () => {
    it('should find an existing task', () => {
      const tasks = [
        createTestTask({ id: 'task_1' }),
        createTestTask({ id: 'task_2' }),
        createTestTask({ id: 'task_3' }),
      ];

      const result = findTaskById(tasks, 'task_2');

      expect(result?.id).toBe('task_2');
    });

    it('should return undefined for non-existent task', () => {
      const tasks = [createTestTask({ id: 'task_1' })];

      const result = findTaskById(tasks, 'task_999');

      expect(result).toBeUndefined();
    });
  });

  describe('completeTaskInCollection', () => {
    it('should complete a task and update the collection', () => {
      const now = new Date('2026-01-14T12:00:00');
      const tasks = [
        createTestTask({ id: 'task_1' }),
        createTestTask({ id: 'task_2' }),
      ];

      const { tasks: updatedTasks, result } = completeTaskInCollection(
        tasks,
        'task_1',
        'Nurse Smith',
        now
      );

      expect(result.success).toBe(true);
      expect(updatedTasks[0].status).toBe('completed');
      expect(updatedTasks[0].completedBy).toBe('Nurse Smith');
      expect(updatedTasks[1].status).toBe('pending');
    });

    it('should return error for non-existent task', () => {
      const tasks = [createTestTask({ id: 'task_1' })];

      const { result } = completeTaskInCollection(tasks, 'task_999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should not modify original array', () => {
      const now = new Date('2026-01-14T12:00:00');
      const tasks = [createTestTask({ id: 'task_1' })];

      completeTaskInCollection(tasks, 'task_1', 'Nurse', now);

      expect(tasks[0].status).toBe('pending');
    });
  });

  describe('addNotesToTaskInCollection', () => {
    it('should add notes to a task in the collection', () => {
      const tasks = [
        createTestTask({ id: 'task_1' }),
        createTestTask({ id: 'task_2' }),
      ];

      const { tasks: updatedTasks, success } = addNotesToTaskInCollection(
        tasks,
        'task_1',
        'Patient unreachable'
      );

      expect(success).toBe(true);
      expect(updatedTasks[0].notes).toBe('Patient unreachable');
      expect(updatedTasks[1].notes).toBeUndefined();
    });

    it('should return error for non-existent task', () => {
      const tasks = [createTestTask({ id: 'task_1' })];

      const { success, error } = addNotesToTaskInCollection(tasks, 'task_999', 'Notes');

      expect(success).toBe(false);
      expect(error).toContain('not found');
    });
  });

  describe('serialization', () => {
    it('should serialize tasks to JSON', () => {
      const tasks = [
        createTestTask({
          id: 'task_1',
          completedAt: new Date('2026-01-14T14:00:00'),
        }),
      ];

      const json = serializeTasksForStorage(tasks);
      const parsed = JSON.parse(json);

      expect(parsed[0].id).toBe('task_1');
      expect(typeof parsed[0].dueStart).toBe('string');
      expect(parsed[0].dueStart).toContain('2026-01-14');
    });

    it('should deserialize tasks from JSON', () => {
      const json = JSON.stringify([
        {
          id: 'task_1',
          patientId: 'MRN001',
          type: 'contact_patient',
          status: 'completed',
          dueStart: '2026-01-14T10:00:00.000Z',
          dueEnd: '2026-01-15T10:00:00.000Z',
          completedAt: '2026-01-14T14:00:00.000Z',
          completedBy: 'Nurse Smith',
        },
      ]);

      const tasks = deserializeTasksFromStorage(json);

      expect(tasks[0].id).toBe('task_1');
      expect(tasks[0].dueStart instanceof Date).toBe(true);
      expect(tasks[0].completedAt instanceof Date).toBe(true);
    });

    it('should round-trip serialize and deserialize', () => {
      const original = [
        createTestTask({
          id: 'task_1',
          completedAt: new Date('2026-01-14T14:00:00'),
          completedBy: 'Test User',
          notes: 'Test notes',
        }),
      ];

      const json = serializeTasksForStorage(original);
      const restored = deserializeTasksFromStorage(json);

      expect(restored[0].id).toBe(original[0].id);
      expect(restored[0].status).toBe(original[0].status);
      expect(restored[0].completedBy).toBe(original[0].completedBy);
      expect(restored[0].notes).toBe(original[0].notes);
    });
  });

  describe('TaskStore', () => {
    let store: TaskStore;

    beforeEach(() => {
      store = new TaskStore([
        createTestTask({ id: 'task_1', patientId: 'MRN001' }),
        createTestTask({ id: 'task_2', patientId: 'MRN001' }),
        createTestTask({ id: 'task_3', patientId: 'MRN002' }),
      ]);
    });

    describe('getAllTasks', () => {
      it('should return all tasks', () => {
        const tasks = store.getAllTasks();
        expect(tasks.length).toBe(3);
      });

      it('should recalculate statuses', () => {
        const now = new Date('2026-01-16T12:00:00'); // After dueEnd
        const tasks = store.getAllTasks(now);

        expect(tasks[0].status).toBe('overdue');
      });
    });

    describe('getTaskById', () => {
      it('should find a task by ID', () => {
        const task = store.getTaskById('task_2');
        expect(task?.id).toBe('task_2');
      });

      it('should return undefined for non-existent ID', () => {
        const task = store.getTaskById('task_999');
        expect(task).toBeUndefined();
      });
    });

    describe('getTasksByPatientId', () => {
      it('should filter by patient ID', () => {
        const tasks = store.getTasksByPatientId('MRN001');
        expect(tasks.length).toBe(2);
        expect(tasks.every((t) => t.patientId === 'MRN001')).toBe(true);
      });
    });

    describe('getTasksByStatus', () => {
      it('should filter by status', () => {
        const now = new Date('2026-01-14T12:00:00');
        const tasks = store.getTasksByStatus('pending', now);
        expect(tasks.length).toBe(3);
      });
    });

    describe('completeTask', () => {
      it('should complete a task in the store', () => {
        const now = new Date('2026-01-14T12:00:00');
        const result = store.completeTask('task_1', 'Nurse Smith', now);

        expect(result.success).toBe(true);
        expect(store.getTaskById('task_1')?.status).toBe('completed');
        expect(store.getTaskById('task_1')?.completedBy).toBe('Nurse Smith');
      });

      it('should return error for invalid task', () => {
        const result = store.completeTask('task_999');
        expect(result.success).toBe(false);
      });
    });

    describe('addTaskNotes', () => {
      it('should add notes to a task', () => {
        const result = store.addTaskNotes('task_1', 'Patient called back');

        expect(result.success).toBe(true);
        expect(store.getTaskById('task_1')?.notes).toBe('Patient called back');
      });
    });

    describe('addTasks', () => {
      it('should add new tasks to the store', () => {
        store.addTasks([createTestTask({ id: 'task_4' })]);
        expect(store.getTaskCount()).toBe(4);
      });
    });

    describe('setTasks', () => {
      it('should replace all tasks', () => {
        store.setTasks([createTestTask({ id: 'task_new' })]);
        expect(store.getTaskCount()).toBe(1);
        expect(store.getTaskById('task_new')).toBeDefined();
      });
    });

    describe('exportToJson and importFromJson', () => {
      it('should export and import tasks', () => {
        const json = store.exportToJson();
        const newStore = new TaskStore();
        newStore.importFromJson(json);

        expect(newStore.getTaskCount()).toBe(3);
        expect(newStore.getTaskById('task_1')).toBeDefined();
      });
    });

    describe('clear', () => {
      it('should remove all tasks', () => {
        store.clear();
        expect(store.getTaskCount()).toBe(0);
      });
    });
  });
});
