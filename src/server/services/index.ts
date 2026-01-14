export {
  // Task generation
  generateTaskId,
  getDischargeDateTime,
  generateTasksForPatient,
  generateTasksForPatients,
  // Task status calculations
  calculateTaskStatus,
  isTaskOverdue,
  getTimeRemaining,
  getTimeRemainingFormatted,
  updateTaskStatuses,
  getOverdueTasks,
  getPendingTasks,
  getUpcomingTasks,
  // Task status transitions
  completeTask,
  addTaskNote,
  updateTask,
  completeTaskInList,
  addNoteToTaskInList,
  // Task queries
  findTaskById,
  getTasksByPatientId,
  getCompletedTasks,
  getTasksCompletedInRange,
  getTasksCompletedToday,
} from './taskGenerator';
