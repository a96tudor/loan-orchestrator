# Loan Orchestrator

A monorepo containing a full-stack loan orchestration application.

## Architecture

This monorepo is organized into three main components:

### Frontend (`frontend/`)
- **Technology**: React 18 with Vite, TypeScript, and Tailwind CSS
- **Purpose**: User interface for the loan orchestration system
- **Status**: Minimal Vite React app initialized (no components, pages, or API calls yet)

### Backend (`backend/`)
- **Technology**: Flask (Python) with Poetry for dependency management
- **Purpose**: REST API for loan orchestration business logic
- **Status**: Flask application factory initialized (no routes/endpoints yet)

### Infrastructure (`infra/`)
- **Purpose**: Infrastructure as Code, Docker configurations, and deployment scripts
- **Status**: Directory created (Docker setup to be added later)

## Technology Stack

- **Frontend**: React 18.2.0 with Vite, TypeScript, and Tailwind CSS
- **Backend**: Flask 3.0.0 (Python) with Poetry
- **Database**: PostgreSQL (to be dockerized)
- **Containerization**: Docker (to be configured)

## Project Structure

```
loan-orchestrator/
├── README.md
├── .gitignore
├── .editorconfig
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   └── src/
│       └── backend_app/
│           ├── __init__.py
│           ├── __main__.py
│           └── app.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
└── infra/
```

## Getting Started

### Prerequisites
- Python 3.8+
- Poetry (for Python dependency management)
- Node.js 16+
- Docker (for future containerization)

### Backend Setup

**Important**: It is recommended to use a virtual environment for Python development. Poetry will automatically create and manage a virtual environment for you.

1. Install Poetry (if not already installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   poetry install
   ```

3. Copy the environment example file and configure your database credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run the application:
   ```bash
   poetry run python -m backend_app.app
   ```

   The Flask application will start on `http://localhost:5000`.

   Alternatively, activate the Poetry shell:
   ```bash
   poetry shell
   python -m backend_app.app
   ```

### Frontend Setup

**Note**: Node.js projects use `node_modules` for dependency isolation, which is similar to Python virtual environments. The dependencies are installed locally in the project directory.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` (or the next available port).

4. For production build:
   ```bash
   npm run build
   npm run preview
   ```

## Future Development

- Docker containerization for all services
- PostgreSQL database setup
- API endpoint implementation
- React components and pages
- Authentication and authorization
- Integration between frontend and backend
