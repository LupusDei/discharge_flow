# Discharge Flow MVP

A single-page application for hospital assistants to manage patient post-discharge workflow tasks.

## Overview

Hospital assistants use this application to track discharge obligations across multiple patients. Each task has a specific timeframe from patient discharge date for completion.

## Discharge Tasks

| Task | Timeframe | Condition |
|------|-----------|-----------|
| Contact Patient | Within 24 hours | All patients |
| Medication Reconciliation | Within 48 hours | All patients |
| Confirm Followup Scheduling | Within 48 hours | All patients |
| Facility Handoff Confirmation | Within 24 hours | SNF discharges only |
| 48hr Check-in Call | 48-72 hours after discharge | High-risk patients only |

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express
- **Database**: CSV file storage
- **Design**: Simple flat design

## Project Structure

```
discharge_flow/
├── src/
│   ├── client/           # React frontend
│   │   ├── components/   # Reusable UI components
│   │   ├── views/        # Page views
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx
│   ├── server/           # Node.js backend
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── index.ts
│   └── shared/           # Shared types between client/server
├── data/                 # CSV data files
├── public/
└── package.json
```

## Implementation Plan

### Phase 1: Project Foundation (Sequential)

**Epic: Project Setup**
- Initialize Vite project with React and TypeScript
- Configure project structure (client/server/shared)
- Set up ESLint and build scripts
- Configure development environment (concurrent client/server)

### Phase 2: Core Infrastructure (Parallel after Phase 1)

Three parallel tracks:

**Track A: Data Layer**
- Define shared TypeScript types (Patient, Task, TaskType, TaskStatus)
- Create CSV parser service
- Create patient data service with CRUD operations

**Track B: Backend API**
- Set up Express server with TypeScript
- Create API route structure
- Implement patient endpoints
- Implement task endpoints

**Track C: UI Component Library**
- Create base components (Button, Card, Badge, Table)
- Create task-specific components (TaskCard, TaskStatusBadge)
- Create patient-specific components (PatientCard, PatientHeader)
- Set up basic CSS/styling

### Phase 3: Business Logic (After Track A)

**Epic: Task Engine**
- Implement task generation from discharge date
- Implement conditional task logic (SNF, high-risk filtering)
- Implement time window calculations
- Implement task status transitions

### Phase 4: Views & Integration (After Phases 2 & 3)

**Epic: Application Views**
- Dashboard view (summary stats, urgent tasks)
- Task list view (filterable by status, due date, patient)
- Patient detail view (all tasks for single patient)
- Task completion workflow

### Phase 5: Polish (After Phase 4)

**Epic: Final Integration**
- Connect all frontend views to backend API
- Error handling and loading states
- Final testing and bug fixes

## Dependency Graph

```
Phase 1: Project Setup
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
Track A:           Track B:           Track C:
Data Layer         Backend API        UI Components
    │                  │                  │
    ▼                  │                  │
Phase 3:               │                  │
Task Engine            │                  │
    │                  │                  │
    └──────────────────┴──────────────────┘
                       │
                       ▼
              Phase 4: Views
                       │
                       ▼
              Phase 5: Polish
```

## Data Models

### Patient
```typescript
interface Patient {
  // Identifiers
  patientId: string;              // MRN (Medical Record Number)
  patientName: string;

  // Demographics
  dob: string;                    // Date of birth (YYYY-MM-DD)
  gender: "M" | "F";
  phone: string | null;           // May be empty
  email: string | null;           // May be empty
  preferredLanguage: string;      // English, Spanish, Korean, Mandarin, etc.

  // Admission/Discharge
  admissionDate: string;          // YYYY-MM-DD
  dischargeDate: string;          // YYYY-MM-DD - Key for task timing
  dischargeTime: string | null;   // HH:MM - May be empty
  lengthOfStay: number;           // Days

  // Clinical
  primaryDiagnosis: string;
  dischargeDisposition: DischargeDisposition;  // Key for facility handoff task
  dischargeMedications: string;   // Comma-separated list
  allergies: string | null;       // NKDA = No Known Drug Allergies

  // Care Team
  attendingPhysician: string;
  pcpName: string | null;         // Primary care physician - may be empty
  pcpPhone: string | null;        // May be empty

  // Risk Assessment
  readmissionRiskScore: RiskLevel;  // Key for 48hr check-in task
  fallRisk: RiskLevel | null;       // May be empty

  // Other
  notes: string | null;           // Free text notes
}

type DischargeDisposition =
  | "Home"
  | "Home with home health"
  | "Skilled nursing facility";

type RiskLevel = "Low" | "Medium" | "High" | "Very High";
```

### Task
```typescript
interface Task {
  id: string;
  patientId: string;
  type: TaskType;
  status: TaskStatus;
  dueStart: Date;                 // When task window opens
  dueEnd: Date;                   // When task window closes (deadline)
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

type TaskStatus = "pending" | "completed" | "overdue" | "upcoming";

type TaskType =
  | "contact_patient"           // Within 24hrs - all patients
  | "medication_reconciliation" // Within 48hrs - all patients
  | "followup_scheduling"       // Within 48hrs - all patients
  | "facility_handoff"          // Within 24hrs - SNF only
  | "checkin_call";             // 48-72hrs - High/Very High risk only
```

### Task Generation Rules
```typescript
const TASK_RULES: Record<TaskType, TaskRule> = {
  contact_patient: {
    windowStart: 0,      // hours after discharge
    windowEnd: 24,
    condition: () => true,  // All patients
  },
  medication_reconciliation: {
    windowStart: 0,
    windowEnd: 48,
    condition: () => true,  // All patients
  },
  followup_scheduling: {
    windowStart: 0,
    windowEnd: 48,
    condition: () => true,  // All patients
  },
  facility_handoff: {
    windowStart: 0,
    windowEnd: 24,
    condition: (p) => p.dischargeDisposition === "Skilled nursing facility",
  },
  checkin_call: {
    windowStart: 48,
    windowEnd: 72,
    condition: (p) => ["High", "Very High"].includes(p.readmissionRiskScore),
  },
};
```

## API Endpoints

```
GET    /api/patients              # List all patients for assistant
GET    /api/patients/:id          # Get single patient with tasks
GET    /api/tasks                 # List all tasks (filterable)
GET    /api/tasks/urgent          # Tasks due within 4 hours
PATCH  /api/tasks/:id             # Update task status
GET    /api/dashboard/stats       # Dashboard statistics
```

## Running the Application

```bash
# Install dependencies
npm install

# Development (runs both client and server)
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## CSV Data Format

The `patient_data.csv` file contains the following columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `patient_id` | string | Yes | Medical Record Number (MRN) |
| `patient_name` | string | Yes | Patient full name |
| `dob` | date | Yes | Date of birth (YYYY-MM-DD) |
| `gender` | string | Yes | M or F |
| `phone` | string | No | Contact phone number |
| `email` | string | No | Contact email |
| `preferred_language` | string | Yes | English, Spanish, Korean, Mandarin, etc. |
| `admission_date` | date | Yes | YYYY-MM-DD |
| `discharge_date` | date | Yes | YYYY-MM-DD - Key for task timing |
| `discharge_time` | time | No | HH:MM format |
| `length_of_stay` | number | Yes | Days |
| `primary_diagnosis` | string | Yes | Diagnosis description |
| `discharge_disposition` | string | Yes | Home, Home with home health, Skilled nursing facility |
| `discharge_medications` | string | Yes | Comma-separated medication list |
| `allergies` | string | No | NKDA = No Known Drug Allergies |
| `attending_physician` | string | Yes | Attending physician name |
| `pcp_name` | string | No | Primary care physician name |
| `pcp_phone` | string | No | PCP phone number |
| `readmission_risk_score` | string | Yes | Low, Medium, High, Very High |
| `fall_risk` | string | No | Low, Medium, High, Very High |
| `notes` | string | No | Free text notes |

### Key Fields for Task Logic

- **`discharge_disposition`**: "Skilled nursing facility" triggers Facility Handoff task
- **`readmission_risk_score`**: "High" or "Very High" triggers 48hr Check-in Call task
- **`discharge_date`** + **`discharge_time`**: Used to calculate all task deadlines
