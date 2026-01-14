import { HTMLAttributes } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Badge, BadgeVariant } from './Badge';
import { Button } from './Button';
import type { Patient, RiskLevel } from '@shared/types';

interface PatientCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  patient: Patient;
  pendingTaskCount?: number;
  overdueTaskCount?: number;
  onViewDetails?: (patientId: string) => void;
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
  }).format(date);
}

export function PatientCard({
  patient,
  pendingTaskCount = 0,
  overdueTaskCount = 0,
  onViewDetails,
  className = '',
  ...props
}: PatientCardProps) {
  return (
    <Card className={`patient-card ${className}`.trim()} {...props}>
      <CardHeader>
        <div className="patient-card__header">
          <div className="patient-card__info">
            <span className="patient-card__name">{patient.patientName}</span>
            <span className="patient-card__mrn">MRN: {patient.patientId}</span>
          </div>
          <Badge variant={riskLevelVariantMap[patient.readmissionRiskScore]}>
            {patient.readmissionRiskScore}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="patient-card__body">
          <div className="patient-card__row">
            <span className="patient-card__label">Diagnosis:</span>
            <span className="patient-card__value">{patient.primaryDiagnosis}</span>
          </div>
          <div className="patient-card__row">
            <span className="patient-card__label">Discharged:</span>
            <span className="patient-card__value">{formatDate(patient.dischargeDate)}</span>
          </div>
          <div className="patient-card__row">
            <span className="patient-card__label">Disposition:</span>
            <span className="patient-card__value">{patient.dischargeDisposition}</span>
          </div>
          <div className="patient-card__tasks">
            {overdueTaskCount > 0 && (
              <Badge variant="danger">{overdueTaskCount} overdue</Badge>
            )}
            {pendingTaskCount > 0 && (
              <Badge variant="warning">{pendingTaskCount} pending</Badge>
            )}
            {pendingTaskCount === 0 && overdueTaskCount === 0 && (
              <Badge variant="success">All tasks complete</Badge>
            )}
          </div>
        </div>
      </CardBody>
      {onViewDetails && (
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(patient.patientId)}
          >
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
