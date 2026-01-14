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
  id: string;
  name: string;
  dischargeDate: Date;
  dischargeDestination: string; // "Home", "Skilled Nursing Facility", etc.
  riskLevel: "standard" | "high";
  assignedTo: string; // Assistant ID
}
```

### Task
```typescript
interface Task {
  id: string;
  patientId: string;
  type: TaskType;
  status: "pending" | "completed" | "overdue";
  dueDate: Date;
  completedAt?: Date;
  completedBy?: string;
}

type TaskType =
  | "contact_patient"
  | "medication_reconciliation"
  | "followup_scheduling"
  | "facility_handoff"
  | "checkin_call";
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

Expected columns in patient CSV:
- `patient_id`
- `patient_name`
- `discharge_date`
- `discharge_destination`
- `risk_level`
- `assigned_assistant`
