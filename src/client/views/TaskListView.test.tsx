import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskListView } from './TaskListView';
import type { Task, Patient } from '@shared/types';

const mockTasks: Task[] = [
  {
    id: 'task-1',
    patientId: 'MRN001',
    type: 'contact_patient',
    status: 'overdue',
    dueStart: new Date('2024-01-14T09:00:00'),
    dueEnd: new Date('2024-01-14T17:00:00'),
  },
  {
    id: 'task-2',
    patientId: 'MRN001',
    type: 'medication_reconciliation',
    status: 'pending',
    dueStart: new Date('2024-01-15T09:00:00'),
    dueEnd: new Date('2024-01-16T09:00:00'),
  },
  {
    id: 'task-3',
    patientId: 'MRN002',
    type: 'followup_scheduling',
    status: 'upcoming',
    dueStart: new Date('2024-01-20T09:00:00'),
    dueEnd: new Date('2024-01-21T09:00:00'),
  },
  {
    id: 'task-4',
    patientId: 'MRN002',
    type: 'checkin_call',
    status: 'completed',
    dueStart: new Date('2024-01-12T09:00:00'),
    dueEnd: new Date('2024-01-13T09:00:00'),
    completedAt: new Date('2024-01-12T14:00:00'),
    completedBy: 'Nurse Smith',
  },
];

const mockPatients: Patient[] = [
  {
    patientId: 'MRN001',
    patientName: 'John Doe',
    dob: '1980-05-15',
    gender: 'M',
    phone: '555-0100',
    email: 'john@example.com',
    preferredLanguage: 'English',
    admissionDate: '2024-01-10',
    dischargeDate: '2024-01-14',
    dischargeTime: '10:00',
    lengthOfStay: 4,
    primaryDiagnosis: 'Pneumonia',
    dischargeDisposition: 'Home',
    dischargeMedications: 'Amoxicillin',
    allergies: null,
    attendingPhysician: 'Dr. Wilson',
    pcpName: 'Dr. Brown',
    pcpPhone: '555-0200',
    readmissionRiskScore: 'Medium',
    fallRisk: 'Low',
    notes: null,
  },
  {
    patientId: 'MRN002',
    patientName: 'Jane Smith',
    dob: '1975-08-22',
    gender: 'F',
    phone: '555-0300',
    email: 'jane@example.com',
    preferredLanguage: 'English',
    admissionDate: '2024-01-11',
    dischargeDate: '2024-01-15',
    dischargeTime: '14:00',
    lengthOfStay: 4,
    primaryDiagnosis: 'CHF Exacerbation',
    dischargeDisposition: 'Home with home health',
    dischargeMedications: 'Furosemide',
    allergies: 'Penicillin',
    attendingPhysician: 'Dr. Garcia',
    pcpName: null,
    pcpPhone: null,
    readmissionRiskScore: 'High',
    fallRisk: 'Medium',
    notes: null,
  },
];

vi.mock('../services/patientService', () => ({
  getAllTasks: vi.fn(() => mockTasks),
  getAllPatients: vi.fn(() => mockPatients),
  completeTask: vi.fn((taskId: string) => {
    const task = mockTasks.find(t => t.id === taskId);
    if (task) {
      return { ...task, status: 'completed', completedAt: new Date() };
    }
    return null;
  }),
}));

describe('TaskListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the title', () => {
      render(<TaskListView />);
      expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    });

    it('renders task count badges', () => {
      render(<TaskListView />);
      expect(screen.getByText('1 Overdue')).toBeInTheDocument();
      expect(screen.getByText('1 Pending')).toBeInTheDocument();
      expect(screen.getByText('1 Upcoming')).toBeInTheDocument();
      expect(screen.getByText('1 Completed')).toBeInTheDocument();
    });

    it('renders all tasks', () => {
      render(<TaskListView />);
      expect(screen.getByText(/Showing 4 of 4 tasks/)).toBeInTheDocument();
    });

    it('renders patient information with tasks', () => {
      render(<TaskListView />);
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });

    it('renders patient MRN', () => {
      render(<TaskListView />);
      expect(screen.getAllByText(/MRN: MRN001/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/MRN: MRN002/).length).toBeGreaterThan(0);
    });
  });

  describe('filters', () => {
    it('renders filter dropdowns', () => {
      render(<TaskListView />);
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Task Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
    });

    it('filters by status', () => {
      render(<TaskListView />);
      const statusSelect = screen.getByLabelText('Status');

      fireEvent.change(statusSelect, { target: { value: 'overdue' } });
      expect(screen.getByText(/Showing 1 of 4 tasks/)).toBeInTheDocument();
      // Check that the task card with Contact Patient type is shown
      expect(screen.getByText('Overdue', { selector: '.badge' })).toBeInTheDocument();
    });

    it('filters by task type', () => {
      render(<TaskListView />);
      const typeSelect = screen.getByLabelText('Task Type');

      fireEvent.change(typeSelect, { target: { value: 'medication_reconciliation' } });
      expect(screen.getByText(/Showing 1 of 4 tasks/)).toBeInTheDocument();
      // Check the task card type header
      expect(screen.getByText('Medication Reconciliation', { selector: '.task-card__type' })).toBeInTheDocument();
    });

    it('shows empty state when no tasks match filters', () => {
      render(<TaskListView />);
      const statusSelect = screen.getByLabelText('Status');
      const typeSelect = screen.getByLabelText('Task Type');

      fireEvent.change(statusSelect, { target: { value: 'completed' } });
      fireEvent.change(typeSelect, { target: { value: 'contact_patient' } });

      expect(screen.getByText(/Showing 0 of 4 tasks/)).toBeInTheDocument();
      expect(screen.getByText('No tasks match the current filters.')).toBeInTheDocument();
    });

    it('shows clear filters button when filters are active', () => {
      render(<TaskListView />);

      expect(screen.queryByRole('button', { name: 'Clear Filters' })).not.toBeInTheDocument();

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'pending' } });

      expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
    });

    it('clears filters when clear button is clicked', () => {
      render(<TaskListView />);
      const statusSelect = screen.getByLabelText('Status');

      fireEvent.change(statusSelect, { target: { value: 'pending' } });
      expect(screen.getByText(/Showing 1 of 4 tasks/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
      expect(screen.getByText(/Showing 4 of 4 tasks/)).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('defaults to sorting by urgency', () => {
      render(<TaskListView />);
      const sortSelect = screen.getByLabelText('Sort By') as HTMLSelectElement;
      expect(sortSelect.value).toBe('urgency');
    });

    it('can change sort option', () => {
      render(<TaskListView />);
      const sortSelect = screen.getByLabelText('Sort By');

      fireEvent.change(sortSelect, { target: { value: 'type' } });
      expect((sortSelect as HTMLSelectElement).value).toBe('type');
    });
  });

  describe('task completion', () => {
    it('renders mark complete button for pending tasks', () => {
      render(<TaskListView />);
      const completeButtons = screen.getAllByRole('button', { name: 'Mark Complete' });
      expect(completeButtons.length).toBeGreaterThan(0);
    });
  });
});
