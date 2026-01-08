# Griddle Me This

A frontend-only React web application for teachers to check whether a student's requested subject change can be accommodated within the school timetable. The app finds all valid timetable configurations (potentially involving multiple class swaps) and presents them ranked by feasibility.

## Features

- **Timetable Upload**: Upload master timetable as JSON, persisted to localStorage
- **Change Requests**: Enter student subjects and specify drop/pickup subjects
- **Smart Algorithm**: BFS-based solver finds all valid configurations with minimal changes
- **Ranked Solutions**: Solutions sorted by capacity warnings and number of changes
- **Request History**: Track past requests with pending/applied status

## Prerequisites

- Node.js 22+ (use `nvm use` if you have nvm installed)

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Building for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── TimetableUpload.tsx
│   ├── NewRequest.tsx
│   ├── ResultsDisplay.tsx
│   └── RequestHistory.tsx
├── lib/                  # Core logic
│   ├── storage.ts       # LocalStorage helpers
│   ├── validation.ts    # Data validation
│   ├── timetableUtils.ts    # Subject utility functions
│   └── timetableAlgorithm.ts  # BFS solver + capacity + ranking
├── types/               # TypeScript interfaces
│   └── index.ts
├── __tests__/           # Test files
│   ├── fixtures/        # Test data (sample timetable)
│   ├── helpers/         # Test setup utilities
│   ├── *.test.ts        # Unit tests
│   └── *.integration.test.ts  # Integration tests
└── App.tsx              # Main app component
```

## Tech Stack

- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Jest with ts-jest (testing)
- LocalStorage (data persistence)

## Timetable Data Format

The master timetable should be a JSON array of subject objects:

```json
[
  {
    "allocation": "AL6",
    "code": "11HIM6",
    "level": 11,
    "subject": "HIM",
    "class": 6,
    "semester": "both",
    "enrolled": 23,
    "capacity": 25
  }
]
```

- `allocation`: Block identifier (AL1-AL6)
- `code`: Format `{level}{subject}{class}` (e.g., "10ENG1")
- `semester`: "sem1", "sem2", or "both" (year-long)
- `enrolled`: Current enrollment count
- `capacity`: Maximum class size
