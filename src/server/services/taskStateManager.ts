import { Task, TaskStatus } from '../../shared/types';
import { calculateTaskStatus } from './taskGenerator';

/**
 * Result of a task completion operation
 */
export interface TaskCompletionResult {
  success: boolean;
  task?: Task;
  error?: string;
}

/**
 * Valid status transitions for tasks
 */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  upcoming: ['pending', 'overdue'], // Auto-transitions only, no manual completion from upcoming
  pending: ['completed', 'overdue'],
  overdue: ['completed'],
  completed: [], // Terminal state
};

/**
 * Check if a status transition is valid.
 * Only allows completing tasks that are pending or overdue.
 */
export function isValidTransition(fromStatus: TaskStatus, toStatus: TaskStatus): boolean {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Check if a task can be completed based on its current status.
 */
export function canCompleteTask(task: Task, now: Date = new Date()): boolean {
  const currentStatus = calculateTaskStatus(task, now);
  return currentStatus === 'pending' || currentStatus === 'overdue';
}

/**
 * Complete a task by setting its status to completed and recording metadata.
 *
 * @param task - The task to complete
 * @param completedBy - Optional identifier of who completed the task
 * @param now - Current timestamp (defaults to now, useful for testing)
 * @returns TaskCompletionResult with success status and updated task or error
 */
export function completeTask(
  task: Task,
  completedBy?: string,
  now: Date = new Date()
): TaskCompletionResult {
  const currentStatus = calculateTaskStatus(task, now);

  // Validate the transition
  if (currentStatus === 'completed') {
    return {
      success: false,
      error: 'Task is already completed',
    };
  }

  if (currentStatus === 'upcoming') {
    return {
      success: false,
      error: 'Cannot complete a task before its window opens',
    };
  }

  // Complete the task
  const completedTask: Task = {
    ...task,
    status: 'completed',
    completedAt: now,
    completedBy,
  };

  return {
    success: true,
    task: completedTask,
  };
}

/**
 * Add or update notes on a task.
 *
 * @param task - The task to update
 * @param notes - The notes to add
 * @returns Updated task with notes
 */
export function addTaskNotes(task: Task, notes: string): Task {
  return {
    ...task,
    notes,
  };
}

/**
 * Find a task by ID in a collection.
 */
export function findTaskById(tasks: Task[], taskId: string): Task | undefined {
  return tasks.find((t) => t.id === taskId);
}

/**
 * Complete a task in a collection by ID.
 * Returns the updated collection and the completion result.
 *
 * @param tasks - Collection of tasks
 * @param taskId - ID of task to complete
 * @param completedBy - Optional identifier of who completed the task
 * @param now - Current timestamp
 * @returns Object with updated tasks array and completion result
 */
export function completeTaskInCollection(
  tasks: Task[],
  taskId: string,
  completedBy?: string,
  now: Date = new Date()
): { tasks: Task[]; result: TaskCompletionResult } {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return {
      tasks,
      result: {
        success: false,
        error: `Task with ID '${taskId}' not found`,
      },
    };
  }

  const result = completeTask(tasks[taskIndex], completedBy, now);

  if (!result.success || !result.task) {
    return { tasks, result };
  }

  // Return new array with updated task
  const updatedTasks = [...tasks];
  updatedTasks[taskIndex] = result.task;

  return {
    tasks: updatedTasks,
    result,
  };
}

/**
 * Add notes to a task in a collection by ID.
 *
 * @param tasks - Collection of tasks
 * @param taskId - ID of task to update
 * @param notes - Notes to add
 * @returns Object with updated tasks array and success status
 */
export function addNotesToTaskInCollection(
  tasks: Task[],
  taskId: string,
  notes: string
): { tasks: Task[]; success: boolean; error?: string } {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return {
      tasks,
      success: false,
      error: `Task with ID '${taskId}' not found`,
    };
  }

  const updatedTasks = [...tasks];
  updatedTasks[taskIndex] = addTaskNotes(tasks[taskIndex], notes);

  return {
    tasks: updatedTasks,
    success: true,
  };
}

/**
 * Serialize tasks for storage (convert Date objects to ISO strings).
 */
export function serializeTasksForStorage(tasks: Task[]): string {
  const serializable = tasks.map((task) => ({
    ...task,
    dueStart: task.dueStart instanceof Date ? task.dueStart.toISOString() : task.dueStart,
    dueEnd: task.dueEnd instanceof Date ? task.dueEnd.toISOString() : task.dueEnd,
    completedAt: task.completedAt instanceof Date ? task.completedAt.toISOString() : task.completedAt,
  }));
  return JSON.stringify(serializable, null, 2);
}

/**
 * Deserialize tasks from storage (convert ISO strings back to Date objects).
 */
export function deserializeTasksFromStorage(json: string): Task[] {
  const parsed = JSON.parse(json) as Array<{
    id: string;
    patientId: string;
    type: Task['type'];
    status: Task['status'];
    dueStart: string;
    dueEnd: string;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
  }>;

  return parsed.map((task) => ({
    ...task,
    dueStart: new Date(task.dueStart),
    dueEnd: new Date(task.dueEnd),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  }));
}

/**
 * In-memory task store for server-side state management.
 * This provides a simple interface for managing task state.
 */
export class TaskStore {
  private tasks: Task[] = [];

  constructor(initialTasks: Task[] = []) {
    this.tasks = [...initialTasks];
  }

  /**
   * Get all tasks with updated statuses.
   */
  getAllTasks(now: Date = new Date()): Task[] {
    return this.tasks.map((task) => ({
      ...task,
      status: calculateTaskStatus(task, now),
    }));
  }

  /**
   * Get a task by ID.
   */
  getTaskById(taskId: string): Task | undefined {
    return findTaskById(this.tasks, taskId);
  }

  /**
   * Get tasks for a specific patient.
   */
  getTasksByPatientId(patientId: string, now: Date = new Date()): Task[] {
    return this.tasks
      .filter((t) => t.patientId === patientId)
      .map((task) => ({
        ...task,
        status: calculateTaskStatus(task, now),
      }));
  }

  /**
   * Get tasks filtered by status.
   */
  getTasksByStatus(status: TaskStatus, now: Date = new Date()): Task[] {
    return this.getAllTasks(now).filter((t) => t.status === status);
  }

  /**
   * Complete a task.
   */
  completeTask(taskId: string, completedBy?: string, now: Date = new Date()): TaskCompletionResult {
    const { tasks, result } = completeTaskInCollection(this.tasks, taskId, completedBy, now);
    if (result.success) {
      this.tasks = tasks;
    }
    return result;
  }

  /**
   * Add notes to a task.
   */
  addTaskNotes(taskId: string, notes: string): { success: boolean; error?: string } {
    const { tasks, success, error } = addNotesToTaskInCollection(this.tasks, taskId, notes);
    if (success) {
      this.tasks = tasks;
    }
    return { success, error };
  }

  /**
   * Add tasks to the store.
   */
  addTasks(newTasks: Task[]): void {
    this.tasks.push(...newTasks);
  }

  /**
   * Replace all tasks in the store.
   */
  setTasks(tasks: Task[]): void {
    this.tasks = [...tasks];
  }

  /**
   * Export tasks for storage.
   */
  exportToJson(): string {
    return serializeTasksForStorage(this.tasks);
  }

  /**
   * Import tasks from storage.
   */
  importFromJson(json: string): void {
    this.tasks = deserializeTasksFromStorage(json);
  }

  /**
   * Get the raw task count.
   */
  getTaskCount(): number {
    return this.tasks.length;
  }

  /**
   * Clear all tasks.
   */
  clear(): void {
    this.tasks = [];
  }
}
