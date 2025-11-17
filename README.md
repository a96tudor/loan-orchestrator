# Loan Orchestrator

A monorepo containing a full-stack loan orchestration application.

## Architecture

This monorepo is organized into three main components:

### Frontend (`frontend/`)
- **Technology**: React 18 with Vite, TypeScript, and Tailwind CSS
- **Purpose**: User interface for the loan orchestration system

### Backend (`backend/`)
- **Technology**: Flask (Python) with Poetry for dependency management
- **Purpose**: REST API for loan orchestration business logic

## Technology Stack

- **Frontend**: React 18.2.0 with Vite, TypeScript, and Tailwind CSS
- **Backend**: Flask ^3.0.0 (Python) with Poetry
- **Database**: PostgreSQL
- **Containerization**: Docker

## Running the Application

1. Clone the current repository.

```bash
  git clone git@github.com:a96tudor/loan-orchestrator.git
```

2. Export the `OPENAI_API_KEY` environment variable. A key can be provided via a 
   secure channel.

```bash
  export OPENAI_API_KEY="your_openai_api_key_here"
```

3. Create and run the containers using Docker Compose.

```bash
  docker-compose up --build
```

4. Access the frontend application at http://127.0.0.1/

You can use the frontend to:
* Create and manage pipelines
* Start the evaluation of a given loan
* See the status of ongoing and past evaluations
* Visualize the details of past evaluations, with step-by-step breakdowns

5. Access the API directly at http://127.0.0.1:5001/api/v1/

You will need to use the API to create applications to be reviewed. Here is a CURL 
example of how to do that

```bash
  curl --request POST \
    --url http://127.0.0.1:5001/api/v1/application \
    --header 'Content-Type: application/json' \
    --header 'User-Agent: insomnia/12.0.0' \
    --data '{
    "applicantName": "John Doe",
    "amount": 10000.0,
    "monthlyIncome": 20000.0,
    "declaredDebts": 5000.0,
    "country": "France",
    "loanPurpose": "I would like to buy a new house to move with my family in."
  }'
```

Additionally, [here](https://drive.google.com/file/d/1UGHzjvWfIPm1SNip7GtM9V3wBGVV7R7x/view?usp=sharing) 
you can find an insomnia collection with more request examples.

