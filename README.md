# Griddle Me This

A frontend-only React web application for teachers to check whether a student's requested subject change can be accommodated within the school timetable. The app finds all valid timetable configurations (potentially involving multiple class swaps) and presents them ranked by feasibility.

## Features

- **Timetable Upload**: Upload master timetable as JSON, with visual overview grid and enrollment tooltips
- **Smart Validation**: Real-time schedule validation with duplicate subject detection
- **Change Requests**: Two modes supported:
  - **Change Subject**: Drop one subject and pick up a different subject
  - **Change Class**: Find alternative classes of the same subject (e.g., to change teacher or allocation)
- **Duration Filtering**: Pickup options filtered to match drop subject duration (year/semester)
- **BFS Algorithm**: Finds all valid configurations with minimal changes
- **Dual Timetable Display**: Side-by-side current vs new timetable comparison
- **Ranked Solutions**: Solutions sorted by capacity warnings and number of changes
- **Request Management**: Track requests with inline editing, clone, rerun, and delete actions

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

## Deployment

The app is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Setup

1. Push your code to GitHub
2. Go to **Settings → Pages** in your repository
3. Set source to **GitHub Actions**
4. Push to `main` branch to trigger deployment

The app will be deployed to `https://<username>.github.io/griddle-me-this/`

### Manual Deployment

To deploy manually or to a different host:

```bash
npm run build
```

Upload the contents of the `dist/` folder to your static hosting provider.

## Project Structure

```
src/
├── components/                    # React components
│   ├── ui/                       # shadcn/ui components
│   ├── ErrorBoundary.tsx         # Global error handling
│   ├── TimetableUpload.tsx       # JSON upload with timetable overview
│   ├── StudentSubjectInput.tsx   # Autocomplete multi-select with validation
│   ├── ChangeRequestForm.tsx     # Searchable drop/pickup selection
│   ├── NewRequest.tsx            # Container for new request form
│   ├── TimetableGrid.tsx         # Visual AL x Semester grid (dual mode)
│   ├── ChangeSteps.tsx           # Numbered change steps with icons
│   ├── SolutionCard.tsx          # Dual timetable + accept button
│   ├── AlternativeSuggestions.tsx # No-solution alternatives
│   ├── EditableLabel.tsx         # In-place label editing
│   ├── RequestCard.tsx           # Shared request display component
│   ├── ResultsDisplay.tsx        # Results container
│   └── RequestHistory.tsx        # All Requests list
├── lib/                          # Core logic
│   ├── storage.ts                # LocalStorage helpers
│   ├── validation.ts             # Data validation (schedule + duplicates)
│   ├── timetableUtils.ts         # Subject utility functions
│   └── timetableAlgorithm.ts     # BFS solver + capacity + ranking
├── types/                        # TypeScript interfaces
│   └── index.ts
├── __tests__/                    # Test files
│   ├── fixtures/                 # Test data (sample timetable)
│   ├── helpers/                  # Test setup utilities
│   ├── *.test.ts                 # Unit tests
│   └── *.integration.test.ts     # Integration tests
└── App.tsx                       # Main app component
```

## Tech Stack

- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Switzer font (via Fontshare)
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

## Key Concepts

### Schedule Validation

A valid student schedule requires:

- All 6 allocation blocks filled for both semesters
- No duplicate subjects (e.g., cannot have both 10ART1 and 10ART2)
- Year-long subjects occupy one allocation for both semesters

### Duration Filtering

When selecting a subject to pick up:

- If dropping a year-long subject, only year-long options are shown
- If dropping a semester subject, only semester options are shown

### Solution Display

Each solution shows:

- **Current Timetable**: Dropped subjects (red), outgoing moves (amber)
- **New Timetable**: Added subjects (green), incoming moves (amber)
- Numbered steps with capacity indicators
