---
description: "Use when writing tests, running linters, or enforcing code quality standards. Covers ESLint configuration, testing conventions, and pre-commit checks."
applyTo: "iot-environment-monitoring-be/**/*.js"
"iot-environment-monitoring-fe/src/**/*.{js,jsx}"
  
---

# Testing & Code Quality

## ESLint (Frontend)

### Running Linter

```bash
cd iot-environment-monitoring-fe
npm run lint    # Check for violations
npm run lint -- --fix  # Auto-fix most issues
```

### React-Specific Rules

Config: `iot-environment-monitoring-fe/eslint.config.js`

- **exhaustive-deps**: Hook dependencies must be complete

  ```javascript
  // ❌ ESLint error: sensorId missing from deps
  useEffect(() => {
    loadSensor(sensorId);
  }, []); // Should list sensorId

  // ✅ Correct
  useEffect(() => {
    loadSensor(sensorId);
  }, [sensorId]);
  ```

- **react-refresh**: Fast Refresh compatibility (Vite HMR)

  ```javascript
  // ✅ Named components identified by capitalization
  export default function Dashboard() {}

  // ❌ Avoid reassignments (breaks HMR)
  let Component = () => {};
  Component = withRouter(Component); // Use composition instead
  ```

### Rules

- **Must pass** before commit (`npm run lint`)
- **Use auto-fix** for formatting (semicolons, spacing)
- **Manual fixes** for logic issues (unused imports, var→const)

## Backend Code Quality

### No automated eslint currently, but follow patterns:

- Use `const`, not `var`
- Arrow functions for consistency
- Async/await (not `.then()` chains)
- Error handling: Always throw or pass errors to middleware

### Testing Endpoints Manually (No Jest Setup Yet)

#### Using Swagger UI

1. Start backend: `npm run dev`
2. Open: `http://localhost:5000/api-docs`
3. Click endpoint → "Try it out" → Add parameters → "Execute"
4. Verify response format and HTTP status

#### Using Postman/Insomnia

```http
GET /sensors HTTP/1.1
Host: localhost:5000

---
Response:
{
  "success": true,
  "data": [{ "id": 1, "name": "Temp Sensor", "type": "temperature" }],
  "message": "All sensors retrieved"
}
```

#### Using cURL

```bash
curl -X GET http://localhost:5000/sensors \
  -H "Content-Type: application/json"

curl -X POST http://localhost:5000/sensors \
  -H "Content-Type: application/json" \
  -d '{"name":"Humidity","type":"humidity","deviceId":1}'
```

### Testing Checklist

- [ ] Happy path: Valid input → 200, correct response structure
- [ ] Bad input: Missing/invalid fields → 400 with message
- [ ] Not found: Invalid ID → 404 with message
- [ ] Duplicates: Unique constraint → 409 (conflict)
- [ ] Swagger JSDoc: Parameter/response in docs match implementation
- [ ] Eager loading: Related data included when documented
- [ ] Error format: Always `{ success, data, message }`

## Frontend Testing Conventions

### Manual Component Testing (React 19 + Vite)

#### Run Development Server

```bash
cd iot-environment-monitoring-fe
npm run dev
```

#### Test Checklist

- [ ] Component renders without errors (check browser console)
- [ ] Props passed correctly (React DevTools inspect)
- [ ] useEffect dependencies correct (ESLint passes)
- [ ] Socket.io connects (DevTools → Network → WS)
- [ ] API calls work (Network tab shows GET/POST requests)
- [ ] Error states display (pass `error` prop or disconnect API)
- [ ] No infinite loops (Frame rate normal, not dropping)

#### Using React DevTools Browser Extension

```javascript
// Check component state/props
React DevTools → Components tab → Click component
// See state, props, hooks in sidebar
```

#### Debugging Hook Issues

```javascript
// In console, enable hook inspection
export default function Dashboard() {
  const [state, setState] = useState(null);

  // Component.state = state // Debug in DevTools

  useEffect(() => {
    console.log("useEffect triggered with deps:", state);
  }, [state]);
}
```

## Pre-Commit Workflow

### Backend

```bash
cd iot-environment-monitoring-be

# 1. Code review: Check for AppError usage, correct error codes
# 2. JSDoc check: Run `npm run dev` → test in Swagger
# 3. Database test: Verify associations & eager loading work
npm run dev
```

### Frontend

```bash
cd iot-environment-monitoring-fe

# 1. Lint check (must pass)
npm run lint

# 2. Build check (must not error)
npm run build

# 3. Manual test: Run dev server, test in browser
npm run dev
```

## Performance Considerations

### Frontend

- **Avoid rendering all items**: Use pagination/virtualization
- **Memoize expensive functions**: `useMemo`, `useCallback` for heavy computations
- **Lazy load routes**: Use `React.lazy()` for large page bundles
- **Avoid unnecessary re-renders**: Check dependencies, use Context wisely

### Backend

- **Eager load strategically**: Include related data in one query, not separate queries
- **Pagination**: Always limit results (don't return all 10,000 sensor records)
- **Database indexes**: Consider for frequently filtered columns (`sensorId`, `deviceId`, `createdAt`)
- **MQTT reconnect**: Automatic via reconnectPeriod (don't flood with reconnect attempts)

## Debugging Tips

### Backend: Enable Debug Logs

```javascript
// Before connect
const client = mqtt.connect(...);
client.on('message', async (topic, message) => {
  console.log(`[MQTT] Topic: ${topic}, Message: ${message}`);
});
```

### Frontend: Console & Network Tabs

```javascript
// Log Socket.io events
const socket = io(...);
socket.onAny((event, ...args) => {
  console.log(`[Socket.io] ${event}`, args);
});

// Check API calls in Network tab: Filter by XHR/Fetch
```

### Database: Query Logs

```javascript
// In server.js, enable Sequelize SQL logging
const sequelize = new Sequelize(..., {
  logging: console.log, // Prints every SQL query
});
```

---

**Checklist before commit:**

- [ ] Frontend: `npm run lint` passes
- [ ] Frontend: `npm run build` succeeds
- [ ] Backend: Tested with Swagger (or curl/Postman)
- [ ] All errors throw `AppError`
- [ ] JSDoc comments match implementation
- [ ] No console.errors in browser (DevTools)
- [ ] Socket.io connects and receives events
- [ ] Pagination works for large datasets
