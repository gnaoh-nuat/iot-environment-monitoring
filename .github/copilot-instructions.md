# IoT Environment Monitoring – Workspace Instructions

## Code Style

### General

- **Indentation**: 2 spaces
- **Semicolons**: Required (JavaScript/JSX enforced by ESLint)
- **Quotes**: Single quotes in JS/JSX, double quotes in JSON
- **Naming**: Strict camelCase (vars/functions), PascalCase (classes/components)

### Backend (Node.js/Express)

- Use `const` by default, `let` for reassignments
- Arrow functions preferred
- Async/await over `.then()` chains
- See `iot-environment-monitoring-be/` for imports/structure patterns

### Frontend (React/JSX)

- Functional components with hooks (no class components)
- Import React hooks and dependencies at the top
- ESLint config: `eslint.config.js`
- Run `npm run lint` to validate—must pass before commit

## Architecture

This is a **full-stack monorepo** with clear separation:

```
Frontend (React 19 + Vite)         Backend (Express 5 + Node)         Database (PostgreSQL)
├─ Vite dev server :5173          ├─ REST API server :5000           ├─ Sequelize ORM
├─ React Router client-side        ├─ Swagger docs @ /api-docs        ├─ 4 core tables:
├─ TailwindCSS styling            ├─ MQTT client (device data)        │   Device, Sensor,
├─ Axes + Recharts charts         ├─ Socket.io (frontend updates)     │   SensorData, ActionHistory
├─ SensorContext (global state)   ├─ node-cron (daily cleanup)        └─ Cascade deletes enabled
└─ Custom hooks: useApi, useSocket ├─ Custom AppError middleware
                                  └─ Swagger JSDoc for API docs
```

**Data Flow**:

1. IoT devices → MQTT broker (backend subscribes)
2. Backend processes → stores in PostgreSQL
3. Backend emits via Socket.io → frontend updates UI in real-time
4. Frontend makes REST calls for CRUD operations

**Zero Authentication**: All endpoints are public by design (user/login removed per requirements).

## Build & Test

### Backend Setup

```bash
cd iot-environment-monitoring-be

# 1. Create .env from .env.example, update PostgreSQL credentials:
#    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# 2. Install dependencies
npm install

# 3. Run development server (auto-reload via nodemon)
npm run dev          # Runs on http://localhost:5000

# 4. Test API
# Browser: http://localhost:5000/api-docs (Swagger UI)
# Or use Postman/Insomnia to test endpoints
```

### Frontend Setup

```bash
cd iot-environment-monitoring-fe

# 1. Create .env from .env.example if needed (optional—defaults to localhost:5000)

# 2. Install dependencies
npm install

# 3. Run development server (HMR enabled)
npm run dev          # Runs on http://localhost:5173

# 4. Check code quality
npm run lint         # Must pass

# 5. Build for production
npm run build
npm run preview      # Test production bundle
```

### Prerequisites

- **Node.js** v16+ (npm required)
- **PostgreSQL** v12+ (running locally on 5432 by default)
- **MQTT broker** (Mosquitto or Docker on 1883)
  - _(Optional for testing REST API without devices)_

### Integration Testing

- Both services must be running simultaneously to test full stack
- Real-time updates only work when Socket.io is connected
- Device data only arrives when MQTT broker and devices are active

## Conventions

### File & Folder Names

| Type        | Pattern                       | Example                            |
| ----------- | ----------------------------- | ---------------------------------- |
| Models      | PascalCase                    | `Sensor.js`, `Device.js`           |
| Controllers | camelCase + Controller suffix | `sensorController.js`              |
| Routes      | kebab-case URLs               | `/data-sensors`, `/action-history` |
| Components  | PascalCase                    | `Dashboard.jsx`, `Header.jsx`      |
| Hooks       | `use` + camelCase             | `useApi.js`, `useWebSocket.js`     |
| Utils       | camelCase                     | `formatters.js`, `validators.js`   |

### API Response Format

**All endpoints return this structure** (Backend: `utils/appError.js`):

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Handling

- Backend: Throw `AppError(message, statusCode)` in controllers
- Frontend: `services/api.js` Axios interceptor catches and formats errors
- Status codes: 400 (bad request), 404 (not found), 409 (conflict), 500 (server error)

### Swagger/API Documentation

- **Location**: `iot-environment-monitoring-be/routes/` (JSDoc comments above each endpoint)
- **Format**: Each route has `@swagger` JSDoc block (method, params, responses)
- **Auto-generated**: `config/swagger.js` builds docs from JSDoc comments
- **Update Swagger**: Edit JSDoc → restart server → refresh `/api-docs`

### Database Models (Sequelize)

- Use `sequelize.define()` with timestamps (createdAt, updatedAt)
- Set up associations in `models/associations.js` (foreign keys, cascade delete)
- Migrations: Sequelize `sync()` auto-creates tables on first connection
- Aliases: Use `as` in associations for clear inclusion names (`include: { as: 'sensorInfo' }`)

### State Management

- **Frontend**: React Context (`SensorContext.jsx`) for global sensor list + custom hooks for API/WebSocket
- **No Redux**: Context + hooks are sufficient for app size
- **WebSocket**: `useWebSocket.js` handles Socket.io connection lifecycle

### MQTT & Socket.io Integration

- **MQTT** (device → backend): Subscribe in `mqtt/mqttClient.js`, parse device payloads, store in DB
- **Socket.io** (backend → frontend): Emit events when sensor data arrives, frontend listens in `useWebSocket.js`
- **Message Format**: Each MQTT topic publishes JSON (backend parses and validates)

### Scheduled Tasks

- **Location**: `iot-environment-monitoring-be/cron/cleanupDataSensor.js`
- **Schedule**: Runs daily at 00:00 (midnight)
- **Action**: Deletes `SensorData` older than 24 hours to prevent bloat
- **Update Cron**: Modify cron expression and restart backend

## Quick Troubleshooting

| Issue                       | Solution                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| PostgreSQL connection fails | Check `.env` credentials, ensure `psql` service is running                    |
| MQTT connection fails       | Ensure broker is running on port 1883 (or update `.env`)                      |
| Swagger docs missing        | Verify JSDoc comments in routes/, restart backend                             |
| Frontend can't reach API    | Check `VITE_API_URL` in `.env`, ensure backend is running on 5000             |
| Socket.io not connecting    | Verify backend is running, check browser console for WebSocket errors         |
| ESLint errors               | Run `npm run lint` to see issues, most auto-fixable with prettier integration |

---

**Project Context**: Academic IoT monitoring system (Polytechnic Institute Ho Chi Minh City)  
**Documentation**: See `README.md` for Vietnamese setup guide and endpoint summary
