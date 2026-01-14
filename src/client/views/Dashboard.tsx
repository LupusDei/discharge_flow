import { useState } from 'react';
import { Card, CardBody, Badge, PatientCard, TaskCard } from '../components';
import {
  getAllPatients,
  getAllTasks,
  getDashboardStats,
  initializeDatabase,
  completeTask,
  getTasksByPatientId,
} from '../services';
import type { Patient, Task } from '@shared/types';

interface DashboardStats {
  totalPatients: number;
  pendingTasks: number;
  overdueTasks: number;
  completedToday: number;
  urgentTasks: number;
}

// Initialize database on module load
initializeDatabase();

export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>(() => getAllPatients());
  const [tasks, setTasks] = useState<Task[]>(() => getAllTasks());
  const [stats, setStats] = useState<DashboardStats>(() => getDashboardStats());
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const refreshData = () => {
    setPatients(getAllPatients());
    setTasks(getAllTasks());
    setStats(getDashboardStats());
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId, 'Current User');
    refreshData();
  };

  const handleViewPatient = (patientId: string) => {
    const patient = patients.find(p => p.patientId === patientId);
    setSelectedPatient(patient || null);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
  };

  // Get urgent tasks (overdue or due soon)
  const urgentTasks = tasks
    .filter(t => t.status === 'overdue' || t.status === 'pending')
    .sort((a, b) => {
      // Overdue first, then by due date
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return new Date(a.dueEnd).getTime() - new Date(b.dueEnd).getTime();
    })
    .slice(0, 5);

  // Get task counts per patient for cards
  const getPatientTaskCounts = (patientId: string) => {
    const patientTasks = tasks.filter(t => t.patientId === patientId);
    return {
      pending: patientTasks.filter(t => t.status === 'pending').length,
      overdue: patientTasks.filter(t => t.status === 'overdue').length,
    };
  };

  // Patient detail view
  if (selectedPatient) {
    const patientTasks = getTasksByPatientId(selectedPatient.patientId);

    return (
      <div className="dashboard">
        <button className="button button--ghost button--sm mb-4" onClick={handleBackToList}>
          &larr; Back to Dashboard
        </button>

        <div className="patient-header mb-6">
          <div className="patient-header__main">
            <h2 className="patient-header__name">{selectedPatient.patientName}</h2>
            <div className="patient-header__badges">
              <Badge variant={
                selectedPatient.readmissionRiskScore === 'Low' ? 'success' :
                selectedPatient.readmissionRiskScore === 'Medium' ? 'warning' : 'danger'
              }>
                {selectedPatient.readmissionRiskScore} Risk
              </Badge>
            </div>
          </div>
          <div className="patient-header__details">
            <span className="patient-header__detail">
              <span className="patient-header__label">MRN:</span> {selectedPatient.patientId}
            </span>
            <span className="patient-header__detail">
              <span className="patient-header__label">Diagnosis:</span> {selectedPatient.primaryDiagnosis}
            </span>
            <span className="patient-header__detail">
              <span className="patient-header__label">Disposition:</span> {selectedPatient.dischargeDisposition}
            </span>
            <span className="patient-header__detail">
              <span className="patient-header__label">Discharge Date:</span> {selectedPatient.dischargeDate}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Tasks</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {patientTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleCompleteTask}
            />
          ))}
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardBody>
            <div className="stat-card">
              <span className="stat-card__value">{stats.totalPatients}</span>
              <span className="stat-card__label">Total Patients</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="stat-card">
              <span className="stat-card__value text-warning">{stats.pendingTasks}</span>
              <span className="stat-card__label">Pending Tasks</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="stat-card">
              <span className="stat-card__value text-danger">{stats.overdueTasks}</span>
              <span className="stat-card__label">Overdue Tasks</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="stat-card">
              <span className="stat-card__value text-success">{stats.completedToday}</span>
              <span className="stat-card__label">Completed Today</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Urgent Tasks</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {urgentTasks.map(task => {
              const patient = patients.find(p => p.patientId === task.patientId);
              return (
                <div key={task.id} className="urgent-task">
                  <div className="urgent-task__patient text-sm text-gray mb-2">
                    {patient?.patientName} ({task.patientId})
                  </div>
                  <TaskCard task={task} onComplete={handleCompleteTask} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Patient List */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Patients</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map(patient => {
            const taskCounts = getPatientTaskCounts(patient.patientId);
            return (
              <PatientCard
                key={patient.patientId}
                patient={patient}
                pendingTaskCount={taskCounts.pending}
                overdueTaskCount={taskCounts.overdue}
                onViewDetails={handleViewPatient}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
