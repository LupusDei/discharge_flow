import { HTMLAttributes } from 'react';
import { Badge, BadgeVariant } from './Badge';
import type { Patient, RiskLevel } from '@shared/types';

interface PatientHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  patient: Patient;
}

const riskLevelVariantMap: Record<RiskLevel, BadgeVariant> = {
  'Low': 'success',
  'Medium': 'warning',
  'High': 'danger',
  'Very High': 'danger',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function PatientHeader({ patient, className = '', ...props }: PatientHeaderProps) {
  const age = calculateAge(patient.dob);

  return (
    <div className={`patient-header ${className}`.trim()} {...props}>
      <div className="patient-header__main">
        <h2 className="patient-header__name">{patient.patientName}</h2>
        <div className="patient-header__badges">
          <Badge variant={riskLevelVariantMap[patient.readmissionRiskScore]}>
            {patient.readmissionRiskScore} Risk
          </Badge>
        </div>
      </div>
      <div className="patient-header__details">
        <span className="patient-header__detail">
          <span className="patient-header__label">MRN:</span> {patient.patientId}
        </span>
        <span className="patient-header__detail">
          <span className="patient-header__label">Age:</span> {age} ({patient.gender})
        </span>
        <span className="patient-header__detail">
          <span className="patient-header__label">Discharged:</span> {formatDate(patient.dischargeDate)}
        </span>
        <span className="patient-header__detail">
          <span className="patient-header__label">Disposition:</span> {patient.dischargeDisposition}
        </span>
      </div>
    </div>
  );
}
