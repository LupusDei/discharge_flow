// Client-side services
export {
  initializeDatabase,
  resetDatabase,
  getAllPatients,
  getPatientById,
  searchPatientsByName,
  getAllTasks,
  getTasksByPatientId,
  getTasksByStatus,
  getUrgentTasks,
  getOverdueTasks,
  completeTask,
  addTaskNote,
  getDashboardStats,
} from './patientService';

export { SEED_PATIENTS } from './seedData';
