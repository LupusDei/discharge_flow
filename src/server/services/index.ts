export {
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

export {
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

export type { TaskCompletionResult } from './taskStateManager';
