import { Patient, Task, TaskStatus, TASK_RULES } from '../../shared/types';
import { SEED_PATIENTS } from './seedData';

const STORAGE_KEYS = {
  PATIENTS: 'discharge_flow_patients',
  TASKS: 'discharge_flow_tasks',
  INITIALIZED: 'discharge_flow_initialized',
};

/**
 * Generate a unique ID for tasks
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate the discharge datetime from patient data
 */
function getDischargeDateTime(patient: Patient): Date {
  const dateStr = patient.dischargeDate;
  const timeStr = patient.dischargeTime || '00:00';
  return new Date(`${dateStr}T${timeStr}:00`);
}

/**
 * Generate tasks for a patient based on task rules
 */
function generateTasksForPatient(patient: Patient): Task[] {
  const dischargeDateTime = getDischargeDateTime(patient);
  const tasks: Task[] = [];

  for (const rule of TASK_RULES) {
    // Check if this task applies to this patient
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
 * Calculate the current status of a task based on time
 */
function calculateTaskStatus(task: Task): TaskStatus {
  if (task.status === 'completed') {
    return 'completed';
  }

  const now = new Date();
  const dueStart = new Date(task.dueStart);
  const dueEnd = new Date(task.dueEnd);

  if (now < dueStart) {
    return 'upcoming';
  } else if (now > dueEnd) {
    return 'overdue';
  } else {
    return 'pending';
  }
}

/**
 * Initialize the database with seed data if not already initialized
 */
export function initializeDatabase(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  if (!initialized) {
    // Store seed patients
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));

    // Generate tasks for each patient
    const allTasks: Task[] = [];
    for (const patient of SEED_PATIENTS) {
      const tasks = generateTasksForPatient(patient);
      allTasks.push(...tasks);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));

    // Mark as initialized
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

/**
 * Reset the database to initial seed state
 */
export function resetDatabase(): void {
  localStorage.removeItem(STORAGE_KEYS.PATIENTS);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  initializeDatabase();
}

// =============================================================================
// Patient Operations
// =============================================================================

/**
 * Get all patients
 */
export function getAllPatients(): Patient[] {
  initializeDatabase();
  const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
  return data ? JSON.parse(data) : [];
}

/**
 * Get a patient by ID
 */
export function getPatientById(patientId: string): Patient | null {
  const patients = getAllPatients();
  return patients.find((p) => p.patientId === patientId) || null;
}

/**
 * Search patients by name
 */
export function searchPatientsByName(query: string): Patient[] {
  const patients = getAllPatients();
  const lowerQuery = query.toLowerCase();
  return patients.filter((p) => p.patientName.toLowerCase().includes(lowerQuery));
}

// =============================================================================
// Task Operations
// =============================================================================

/**
 * Get all tasks (with updated status based on current time)
 */
export function getAllTasks(): Task[] {
  initializeDatabase();
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  const tasks: Task[] = data ? JSON.parse(data) : [];

  // Update status based on current time and convert date strings back to Date objects
  return tasks.map((task) => ({
    ...task,
    dueStart: new Date(task.dueStart),
    dueEnd: new Date(task.dueEnd),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    status: calculateTaskStatus({
      ...task,
      dueStart: new Date(task.dueStart),
      dueEnd: new Date(task.dueEnd),
    }),
  }));
}

/**
 * Get tasks for a specific patient
 */
export function getTasksByPatientId(patientId: string): Task[] {
  const tasks = getAllTasks();
  return tasks.filter((t) => t.patientId === patientId);
}

/**
 * Get tasks by status
 */
export function getTasksByStatus(status: TaskStatus): Task[] {
  const tasks = getAllTasks();
  return tasks.filter((t) => t.status === status);
}

/**
 * Get urgent tasks (due within specified hours, default 4)
 */
export function getUrgentTasks(hoursThreshold: number = 4): Task[] {
  const tasks = getAllTasks();
  const now = new Date();
  const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);

  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const dueEnd = new Date(t.dueEnd);
    return dueEnd <= threshold && dueEnd >= now;
  });
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(): Task[] {
  return getTasksByStatus('overdue');
}

/**
 * Mark a task as completed
 */
export function completeTask(taskId: string, completedBy?: string): Task | null {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  const tasks: Task[] = data ? JSON.parse(data) : [];

  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    status: 'completed',
    completedAt: new Date(),
    completedBy,
  };

  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

  // Return the updated task with proper Date objects
  return {
    ...tasks[taskIndex],
    dueStart: new Date(tasks[taskIndex].dueStart),
    dueEnd: new Date(tasks[taskIndex].dueEnd),
    completedAt: new Date(tasks[taskIndex].completedAt!),
  };
}

/**
 * Add a note to a task
 */
export function addTaskNote(taskId: string, note: string): Task | null {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  const tasks: Task[] = data ? JSON.parse(data) : [];

  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    notes: note,
  };

  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

  return {
    ...tasks[taskIndex],
    dueStart: new Date(tasks[taskIndex].dueStart),
    dueEnd: new Date(tasks[taskIndex].dueEnd),
    completedAt: tasks[taskIndex].completedAt ? new Date(tasks[taskIndex].completedAt) : undefined,
  };
}

// =============================================================================
// Dashboard Statistics
// =============================================================================

/**
 * Get dashboard statistics
 */
export function getDashboardStats(): {
  totalPatients: number;
  pendingTasks: number;
  overdueTasks: number;
  completedToday: number;
  urgentTasks: number;
} {
  const patients = getAllPatients();
  const tasks = getAllTasks();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    totalPatients: patients.length,
    pendingTasks: tasks.filter((t) => t.status === 'pending').length,
    overdueTasks: tasks.filter((t) => t.status === 'overdue').length,
    completedToday: tasks.filter((t) => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedAt = new Date(t.completedAt);
      return completedAt >= startOfDay;
    }).length,
    urgentTasks: getUrgentTasks().length,
  };
}
