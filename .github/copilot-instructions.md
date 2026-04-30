# IoT Environment Monitoring - Agent Guide

Use this file as a quick start for coding agents. Keep task-specific details in the linked instruction files.

## Quick Commands

### Backend

```bash
cd iot-environment-monitoring-be
npm install
npm run dev
```

### Frontend

```bash
cd iot-environment-monitoring-fe
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

On Windows PowerShell, if `npm` is blocked by execution policy, run `npm.cmd` instead.

## Project Shape

- Monorepo with frontend in `iot-environment-monitoring-fe/` and backend in `iot-environment-monitoring-be/`.
- Backend boots from `iot-environment-monitoring-be/server.js`, mounts Swagger at `/api-docs`, initializes Socket.io + MQTT.
- Frontend uses React + Vite and calls backend via `iot-environment-monitoring-fe/src/services/api.js`.
- Zero-auth design: all endpoints are public by project requirement.

## Core Conventions

- Indentation: 2 spaces.
- JS/JSX: semicolons required, single quotes preferred.
- Naming: camelCase for variables/functions, PascalCase for components/models.
- Frontend: functional components + hooks only.
- Backend: async/await + centralized error handling (`AppError` + middleware).

## Data + API Rules

- API responses must follow `{ success, data, message }`.
- Define Sequelize associations only in `iot-environment-monitoring-be/models/associations.js`.
- Keep association aliases (`as`) consistent with query includes.
- Prefer Sequelize eager loading over manual join-like fetch chains.

## Environment Essentials

- Backend requires all DB vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Frontend API base is controlled by `VITE_API_URL`.
- Check templates before running:
  - `iot-environment-monitoring-be/.env.example`
  - `iot-environment-monitoring-fe/.env.example`

## Task-Specific Instructions

- REST endpoints and Swagger sync:
  - `.github/instructions/backend-api.instructions.md`
- Sequelize models and associations:
  - `.github/instructions/database-models.instructions.md`
- React components, hooks, and state:
  - `.github/instructions/frontend-components.instructions.md`
- Socket.io and MQTT realtime flow:
  - `.github/instructions/realtime-integration.instructions.md`
- LLM behavior and change guidance:
  - `.github/instructions/llm-behavior-guidelines.instructions.md`
- Lint/testing quality checks:
  - `.github/instructions/testing-quality.instructions.md`

## Additional Docs

- Root setup and backend notes: `README.md`
- Frontend-specific setup: `iot-environment-monitoring-fe/README.md`
