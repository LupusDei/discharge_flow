import { Patient, Task, TaskStatus, TASK_RULES } from '@shared/types';
import { parsePatientCSV } from '../utils/csvParser';

const STORAGE_KEY = 'discharge_flow_patients';
const TASKS_STORAGE_KEY = 'discharge_flow_tasks';

/**
 * Generate tasks for a patient based on task rules
 */
function generateTasksForPatient(patient: Patient): Task[] {
  const dischargeDatetime = new Date(patient.dischargeDate);
  if (patient.dischargeTime) {
    const [hours, minutes] = patient.dischargeTime.split(':').map(Number);
    dischargeDatetime.setHours(hours, minutes);
  }

  const now = new Date();
  const tasks: Task[] = [];

  for (const rule of TASK_RULES) {
    if (!rule.condition(patient)) continue;

    const dueStart = new Date(dischargeDatetime.getTime() + rule.windowStartHours * 60 * 60 * 1000);
    const dueEnd = new Date(dischargeDatetime.getTime() + rule.windowEndHours * 60 * 60 * 1000);

    let status: TaskStatus = 'pending';
    if (now < dueStart) {
      status = 'upcoming';
    } else if (now > dueEnd) {
      status = 'overdue';
    }

    tasks.push({
      id: `${patient.patientId}-${rule.type}`,
      patientId: patient.patientId,
      type: rule.type,
      status,
      dueStart,
      dueEnd,
    });
  }

  return tasks;
}

/**
 * Load patients from localStorage or initialize with empty array
 */
export function getPatients(): Patient[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

/**
 * Save patients to localStorage
 */
export function savePatients(patients: Patient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

/**
 * Load tasks from localStorage or initialize with empty array
 */
export function getTasks(): Task[] {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  if (stored) {
    const tasks = JSON.parse(stored);
    // Convert date strings back to Date objects
    return tasks.map((t: Task) => ({
      ...t,
      dueStart: new Date(t.dueStart),
      dueEnd: new Date(t.dueEnd),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }));
  }
  return [];
}

/**
 * Save tasks to localStorage
 */
export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Initialize the database with CSV data
 */
export async function initializeFromCSV(): Promise<{ patients: Patient[]; tasks: Task[] }> {
  try {
    const response = await fetch('/data/patient_data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    const csvContent = await response.text();
    const patients = parsePatientCSV(csvContent);

    // Generate tasks for all patients
    const allTasks: Task[] = [];
    for (const patient of patients) {
      const tasks = generateTasksForPatient(patient);
      allTasks.push(...tasks);
    }

    savePatients(patients);
    saveTasks(allTasks);

    return { patients, tasks: allTasks };
  } catch (error) {
    console.error('Failed to initialize from CSV:', error);
    return { patients: [], tasks: [] };
  }
}

/**
 * Get patient by ID
 */
export function getPatientById(patientId: string): Patient | undefined {
  const patients = getPatients();
  return patients.find(p => p.patientId === patientId);
}

/**
 * Get tasks for a specific patient
 */
export function getTasksForPatient(patientId: string): Task[] {
  const tasks = getTasks();
  return tasks.filter(t => t.patientId === patientId);
}

/**
 * Update task status
 */
export function updateTaskStatus(taskId: string, status: TaskStatus, completedBy?: string): Task | undefined {
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) return undefined;

  const task = tasks[taskIndex];
  task.status = status;

  if (status === 'completed') {
    task.completedAt = new Date();
    task.completedBy = completedBy;
  }

  saveTasks(tasks);
  return task;
}

/**
 * Get dashboard stats
 */
export function getDashboardStats(): {
  totalPatients: number;
  pendingTasks: number;
  overdueTasks: number;
  completedToday: number;
} {
  const patients = getPatients();
  const tasks = getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    totalPatients: patients.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    overdueTasks: tasks.filter(t => t.status === 'overdue').length,
    completedToday: tasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length,
  };
}

/**
 * Check if data has been initialized
 */
export function isInitialized(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Clear all data
 */
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TASKS_STORAGE_KEY);
}
