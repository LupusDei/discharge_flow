import { Patient, Task, TaskStatus, TASK_RULES } from '../../shared/types';

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

/**
 * Calculate the current status of a task based on time windows.
 *
 * Status logic:
 * - 'completed': Task has been marked complete
 * - 'upcoming': Current time is before the task window opens (dueStart)
 * - 'overdue': Current time is after the task window closes (dueEnd)
 * - 'pending': Current time is within the task window
 */
export function calculateTaskStatus(task: Task, now: Date = new Date()): TaskStatus {
  if (task.status === 'completed') {
    return 'completed';
  }

  const dueStart = task.dueStart instanceof Date ? task.dueStart : new Date(task.dueStart);
  const dueEnd = task.dueEnd instanceof Date ? task.dueEnd : new Date(task.dueEnd);

  if (now < dueStart) {
    return 'upcoming';
  } else if (now > dueEnd) {
    return 'overdue';
  } else {
    return 'pending';
  }
}

/**
 * Check if a task is overdue.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  return calculateTaskStatus(task, now) === 'overdue';
}

/**
 * Calculate time remaining until task deadline (dueEnd).
 * Returns milliseconds remaining, or negative if overdue.
 */
export function getTimeRemaining(task: Task, now: Date = new Date()): number {
  const dueEnd = task.dueEnd instanceof Date ? task.dueEnd : new Date(task.dueEnd);
  return dueEnd.getTime() - now.getTime();
}

/**
 * Get time remaining in a human-readable format.
 * Returns object with hours and minutes, and whether it's overdue.
 */
export function getTimeRemainingFormatted(
  task: Task,
  now: Date = new Date()
): { hours: number; minutes: number; isOverdue: boolean; totalMinutes: number } {
  const remaining = getTimeRemaining(task, now);
  const isOverdue = remaining < 0;
  const absoluteRemaining = Math.abs(remaining);

  const totalMinutes = Math.floor(absoluteRemaining / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, isOverdue, totalMinutes };
}

/**
 * Update task statuses based on current time.
 * Returns tasks with recalculated status.
 */
export function updateTaskStatuses(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks.map((task) => ({
    ...task,
    status: calculateTaskStatus(task, now),
  }));
}

/**
 * Filter tasks to get only overdue ones.
 */
export function getOverdueTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks.filter((task) => isTaskOverdue(task, now));
}

/**
 * Filter tasks to get only pending ones (within time window).
 */
export function getPendingTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks.filter((task) => calculateTaskStatus(task, now) === 'pending');
}

/**
 * Filter tasks to get upcoming ones (window not yet open).
 */
export function getUpcomingTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks.filter((task) => calculateTaskStatus(task, now) === 'upcoming');
}

// =============================================================================
// Task Status Transitions
// =============================================================================

/**
 * Mark a task as completed.
 * Returns a new task object with updated status, completedAt, and completedBy.
 */
export function completeTask(task: Task, completedBy?: string, completedAt: Date = new Date()): Task {
  return {
    ...task,
    status: 'completed',
    completedAt,
    completedBy,
  };
}

/**
 * Add or update a note on a task.
 * Returns a new task object with the note added.
 */
export function addTaskNote(task: Task, note: string): Task {
  return {
    ...task,
    notes: note,
  };
}

/**
 * Apply updates to a task.
 * Returns a new task object with the updates applied.
 */
export function updateTask(task: Task, updates: Partial<Pick<Task, 'status' | 'notes' | 'completedAt' | 'completedBy'>>): Task {
  return {
    ...task,
    ...updates,
  };
}

/**
 * Complete a task in a task list by ID.
 * Returns a new array with the updated task, or null if task not found.
 */
export function completeTaskInList(
  tasks: Task[],
  taskId: string,
  completedBy?: string,
  completedAt: Date = new Date()
): { tasks: Task[]; completedTask: Task | null } {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return { tasks, completedTask: null };
  }

  const completedTask = completeTask(tasks[taskIndex], completedBy, completedAt);
  const newTasks = [...tasks];
  newTasks[taskIndex] = completedTask;

  return { tasks: newTasks, completedTask };
}

/**
 * Add a note to a task in a task list by ID.
 * Returns a new array with the updated task, or null if task not found.
 */
export function addNoteToTaskInList(
  tasks: Task[],
  taskId: string,
  note: string
): { tasks: Task[]; updatedTask: Task | null } {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return { tasks, updatedTask: null };
  }

  const updatedTask = addTaskNote(tasks[taskIndex], note);
  const newTasks = [...tasks];
  newTasks[taskIndex] = updatedTask;

  return { tasks: newTasks, updatedTask };
}

/**
 * Find a task by ID in a task list.
 */
export function findTaskById(tasks: Task[], taskId: string): Task | null {
  return tasks.find((t) => t.id === taskId) || null;
}

/**
 * Get tasks for a specific patient.
 */
export function getTasksByPatientId(tasks: Task[], patientId: string): Task[] {
  return tasks.filter((t) => t.patientId === patientId);
}

/**
 * Get completed tasks.
 */
export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'completed');
}

/**
 * Get tasks completed within a time range.
 */
export function getTasksCompletedInRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
  return tasks.filter((t) => {
    if (t.status !== 'completed' || !t.completedAt) {
      return false;
    }
    const completedAt = t.completedAt instanceof Date ? t.completedAt : new Date(t.completedAt);
    return completedAt >= startDate && completedAt <= endDate;
  });
}

/**
 * Get tasks completed today.
 */
export function getTasksCompletedToday(tasks: Task[], now: Date = new Date()): Task[] {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return getTasksCompletedInRange(tasks, startOfDay, endOfDay);
}
