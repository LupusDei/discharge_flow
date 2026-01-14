import { useState, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TaskCard } from '../components/TaskCard';
import { getAllTasks, getAllPatients, completeTask } from '../services/patientService';
import type { Task, TaskStatus, TaskType, Patient } from '@shared/types';

type SortOption = 'urgency' | 'dueDate' | 'status' | 'type';

interface Filters {
  status: TaskStatus | 'all';
  taskType: TaskType | 'all';
  dueDateRange: 'all' | 'today' | 'tomorrow' | 'week' | 'overdue';
}

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'pending', label: 'Pending' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const TASK_TYPE_OPTIONS: { value: TaskType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'contact_patient', label: 'Contact Patient' },
  { value: 'medication_reconciliation', label: 'Medication Reconciliation' },
  { value: 'followup_scheduling', label: 'Followup Scheduling' },
  { value: 'facility_handoff', label: 'Facility Handoff' },
  { value: 'checkin_call', label: 'Check-in Call' },
];

const DUE_DATE_OPTIONS: { value: Filters['dueDateRange']; label: string }[] = [
  { value: 'all', label: 'All Dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'tomorrow', label: 'Due Tomorrow' },
  { value: 'week', label: 'Due This Week' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'urgency', label: 'Urgency' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Task Type' },
];

function getStatusPriority(status: TaskStatus): number {
  switch (status) {
    case 'overdue': return 0;
    case 'pending': return 1;
    case 'upcoming': return 2;
    case 'completed': return 3;
    default: return 4;
  }
}

function isDateInRange(date: Date, range: Filters['dueDateRange']): boolean {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  const endOfTomorrow = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  switch (range) {
    case 'all':
      return true;
    case 'overdue':
      return date < now;
    case 'today':
      return date >= startOfToday && date <= endOfToday;
    case 'tomorrow':
      return date > endOfToday && date <= endOfTomorrow;
    case 'week':
      return date >= startOfToday && date <= endOfWeek;
    default:
      return true;
  }
}

export function TaskListView() {
  const [tasks, setTasks] = useState<Task[]>(() => getAllTasks());
  const [patients] = useState<Patient[]>(() => getAllPatients());
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    taskType: 'all',
    dueDateRange: 'all',
  });
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const patient of patients) {
      map.set(patient.patientId, patient);
    }
    return map;
  }, [patients]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(task => task.status === filters.status);
    }

    // Apply task type filter
    if (filters.taskType !== 'all') {
      result = result.filter(task => task.type === filters.taskType);
    }

    // Apply due date range filter
    if (filters.dueDateRange !== 'all') {
      result = result.filter(task => isDateInRange(task.dueEnd, filters.dueDateRange));
    }

    // Sort tasks
    result.sort((a, b) => {
      switch (sortBy) {
        case 'urgency': {
          // First by status priority (overdue > pending > upcoming > completed)
          const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
          if (statusDiff !== 0) return statusDiff;
          // Then by due end date (earliest first)
          return a.dueEnd.getTime() - b.dueEnd.getTime();
        }
        case 'dueDate':
          return a.dueEnd.getTime() - b.dueEnd.getTime();
        case 'status':
          return getStatusPriority(a.status) - getStatusPriority(b.status);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, filters, sortBy]);

  const handleCompleteTask = useCallback((taskId: string) => {
    const updatedTask = completeTask(taskId);
    if (updatedTask) {
      setTasks(getAllTasks());
    }
  }, []);

  const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      taskType: 'all',
      dueDateRange: 'all',
    });
  }, []);

  const hasActiveFilters = filters.status !== 'all' ||
    filters.taskType !== 'all' ||
    filters.dueDateRange !== 'all';

  const taskCounts = useMemo(() => {
    const counts = { overdue: 0, pending: 0, upcoming: 0, completed: 0 };
    for (const task of tasks) {
      counts[task.status]++;
    }
    return counts;
  }, [tasks]);

  return (
    <div className="task-list-view">
      <Card className="task-list-view__filters">
        <CardHeader>
          <div className="task-list-view__filters-header">
            <h2 className="task-list-view__title">Tasks</h2>
            <div className="task-list-view__counts">
              <Badge variant="danger">{taskCounts.overdue} Overdue</Badge>
              <Badge variant="warning">{taskCounts.pending} Pending</Badge>
              <Badge variant="info">{taskCounts.upcoming} Upcoming</Badge>
              <Badge variant="success">{taskCounts.completed} Completed</Badge>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="task-list-view__filter-controls">
            <div className="task-list-view__filter-group">
              <label className="task-list-view__filter-label" htmlFor="status-filter">
                Status
              </label>
              <select
                id="status-filter"
                className="task-list-view__select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value as TaskStatus | 'all')}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="task-list-view__filter-group">
              <label className="task-list-view__filter-label" htmlFor="type-filter">
                Task Type
              </label>
              <select
                id="type-filter"
                className="task-list-view__select"
                value={filters.taskType}
                onChange={(e) => handleFilterChange('taskType', e.target.value as TaskType | 'all')}
              >
                {TASK_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="task-list-view__filter-group">
              <label className="task-list-view__filter-label" htmlFor="date-filter">
                Due Date
              </label>
              <select
                id="date-filter"
                className="task-list-view__select"
                value={filters.dueDateRange}
                onChange={(e) => handleFilterChange('dueDateRange', e.target.value as Filters['dueDateRange'])}
              >
                {DUE_DATE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="task-list-view__filter-group">
              <label className="task-list-view__filter-label" htmlFor="sort-select">
                Sort By
              </label>
              <select
                id="sort-select"
                className="task-list-view__select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="task-list-view__clear-btn"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="task-list-view__results">
        <p className="task-list-view__result-count">
          Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
        </p>

        {filteredAndSortedTasks.length === 0 ? (
          <Card className="task-list-view__empty">
            <CardBody>
              <p className="task-list-view__empty-text">
                No tasks match the current filters.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="task-list-view__list">
            {filteredAndSortedTasks.map(task => {
              const patient = patientMap.get(task.patientId);
              return (
                <div key={task.id} className="task-list-view__item">
                  {patient && (
                    <div className="task-list-view__patient-info">
                      <span className="task-list-view__patient-name">{patient.patientName}</span>
                      <span className="task-list-view__patient-mrn">MRN: {patient.patientId}</span>
                    </div>
                  )}
                  <TaskCard
                    task={task}
                    onComplete={handleCompleteTask}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
