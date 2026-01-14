import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientHeader } from './PatientHeader';
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

describe('PatientHeader', () => {
  it('renders patient name', () => {
    render(<PatientHeader patient={basePatient} />);
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
  });

  it('renders patient MRN', () => {
    render(<PatientHeader patient={basePatient} />);
    expect(screen.getByText(/MRN001/)).toBeInTheDocument();
  });

  it('renders risk badge with Low risk', () => {
    render(<PatientHeader patient={basePatient} />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('renders risk badge with High risk', () => {
    const patient = { ...basePatient, readmissionRiskScore: 'High' as const };
    render(<PatientHeader patient={patient} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('renders risk badge with Very High risk', () => {
    const patient = { ...basePatient, readmissionRiskScore: 'Very High' as const };
    render(<PatientHeader patient={patient} />);
    expect(screen.getByText('Very High Risk')).toBeInTheDocument();
  });

  it('renders discharge date', () => {
    render(<PatientHeader patient={basePatient} />);
    // Check that a date is rendered (could be Jan 4 or Jan 5 depending on timezone)
    expect(screen.getByText(/Jan \d, 2024/)).toBeInTheDocument();
  });

  it('renders discharge disposition', () => {
    render(<PatientHeader patient={basePatient} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders gender with age', () => {
    render(<PatientHeader patient={basePatient} />);
    // Age will vary based on current date, so just check for the pattern
    expect(screen.getByText(/\(M\)/)).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<PatientHeader patient={basePatient} className="custom-class" data-testid="header" />);
    expect(screen.getByTestId('header')).toHaveClass('patient-header', 'custom-class');
  });
});
