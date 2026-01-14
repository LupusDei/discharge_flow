import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientCard } from './PatientCard';
import type { Patient } from '@shared/types';

const basePatient: Patient = {
  patientId: 'MRN001',
  patientName: 'John Doe',
  dob: '1950-06-15',
  gender: 'M',
  phone: '555-1234',
  email: 'john@example.com',
  preferredLanguage: 'English',
  admissionDate: '2024-01-01',
  dischargeDate: '2024-01-05',
  dischargeTime: '14:00',
  lengthOfStay: 4,
  primaryDiagnosis: 'Pneumonia',
  dischargeDisposition: 'Home',
  dischargeMedications: 'Amoxicillin',
  allergies: 'NKDA',
  attendingPhysician: 'Dr. Smith',
  pcpName: 'Dr. Jones',
  pcpPhone: '555-5678',
  readmissionRiskScore: 'Low',
  fallRisk: 'Low',
  notes: null,
};

describe('PatientCard', () => {
  it('renders patient name', () => {
    render(<PatientCard patient={basePatient} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders patient MRN', () => {
    render(<PatientCard patient={basePatient} />);
    expect(screen.getByText(/MRN: MRN001/)).toBeInTheDocument();
  });

  it('renders risk badge with Low risk', () => {
    render(<PatientCard patient={basePatient} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders risk badge with High risk', () => {
    const patient = { ...basePatient, readmissionRiskScore: 'High' as const };
    render(<PatientCard patient={patient} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders primary diagnosis', () => {
    render(<PatientCard patient={basePatient} />);
    expect(screen.getByText('Pneumonia')).toBeInTheDocument();
  });

  it('renders discharge date', () => {
    render(<PatientCard patient={basePatient} />);
    // Check that a date is rendered (could be Jan 4 or Jan 5 depending on timezone)
    expect(screen.getByText(/Jan \d/)).toBeInTheDocument();
  });

  it('renders discharge disposition', () => {
    render(<PatientCard patient={basePatient} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('shows overdue task count when provided', () => {
    render(<PatientCard patient={basePatient} overdueTaskCount={3} />);
    expect(screen.getByText('3 overdue')).toBeInTheDocument();
  });

  it('shows pending task count when provided', () => {
    render(<PatientCard patient={basePatient} pendingTaskCount={5} />);
    expect(screen.getByText('5 pending')).toBeInTheDocument();
  });

  it('shows all tasks complete badge when no pending or overdue', () => {
    render(<PatientCard patient={basePatient} pendingTaskCount={0} overdueTaskCount={0} />);
    expect(screen.getByText('All tasks complete')).toBeInTheDocument();
  });

  it('shows View Details button when onViewDetails provided', () => {
    const onViewDetails = vi.fn();
    render(<PatientCard patient={basePatient} onViewDetails={onViewDetails} />);
    expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
  });

  it('does not show View Details button when onViewDetails not provided', () => {
    render(<PatientCard patient={basePatient} />);
    expect(screen.queryByRole('button', { name: 'View Details' })).not.toBeInTheDocument();
  });

  it('calls onViewDetails with patient id when button clicked', () => {
    const onViewDetails = vi.fn();
    render(<PatientCard patient={basePatient} onViewDetails={onViewDetails} />);
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    expect(onViewDetails).toHaveBeenCalledWith('MRN001');
  });

  it('accepts custom className', () => {
    render(<PatientCard patient={basePatient} className="custom-class" data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveClass('patient-card', 'custom-class');
  });
});
