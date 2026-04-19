---
description: "Use when building React components, creating custom hooks, or working with state management. Ensures functional components, proper hook dependencies, and TailwindCSS consistency."
applyTo: "iot-environment-monitoring-fe/src/**/*.{jsx,js}"
---

# Frontend React Components

## Project Defaults

- Use functional components only.
- Prefer single quotes and semicolons in JS/JSX.
- Prefer Tailwind utility classes for styling.
- Reuse existing shared UI (`components/filters`, `Pagination`, `Skeleton`) before creating new components.

## Component Structure

**Always use functional components with hooks. No class components.**

### Template

```javascript
import { useState, useEffect } from "react";
import api from "../services/api";

export default function ComponentName({ title, onClose }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/endpoint");
        setState(response?.data ?? null);
      } catch (requestError) {
        setError(requestError.message || "Request failed");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dependencies]);

  return <div className="p-4 bg-white rounded-lg shadow">{/* JSX */}</div>;
}
```

### Rules

- Default export (named export only for utilities)
- Props at top, destructured
- Hooks before rendering logic
- Comments for complex logic only (self-documenting code preferred)
- Keep render logic pure (avoid `Math.random()`, `Date.now()` directly in render path)

## Hook Dependencies (Critical)

**Missing or incorrect dependencies cause stale closures and hidden bugs.**

### ✅ Correct

```javascript
useEffect(() => {
  const loadData = async () => {
    const result = await fetchSensor(sensorId);
    setData(result);
  };
  loadData();
}, [sensorId]); // Rerun when sensorId changes
```

### ❌ Wrong

```javascript
useEffect(() => {
  const loadData = async () => {
    const result = await fetchSensor(sensorId); // sensorId missing from deps
    setData(result);
  };
  loadData();
}, []); // Empty array! Will use stale sensorId forever
```

### Rules

- **List all external variables** used inside `useEffect` in dependencies
- **Stable references**: Avoid passing object/array literals as dependencies
- Avoid setting component state synchronously in mount-only effects unless truly needed

  ```javascript
  // ❌ Wrong: config recreated on every render
  useEffect(() => {
    api.get("/sensors", { params: { page: 1 } });
  }, []);

  // ✅ Correct: Extract outside or memoize
  const config = useMemo(() => ({ params: { page: 1 } }), []);
  useEffect(() => {
    api.get("/sensors", config);
  }, [config]);
  ```

- **Use ESLint rule**: `react-hooks/exhaustive-deps` catches violations

## Custom Hooks (useApi, useSensorSocket)

### useApi Pattern

```javascript
// Usage in component
const { data, loading, error, execute } = useApi("/sensors", {
  method: "GET",
  params: { pageNo: 1, pageSize: 10 },
});

useEffect(() => {
  execute();
}, [execute]);
```

### useSensorSocket Pattern

```javascript
// Usage in component
const { connected, lastSensorPacket, lastDevicePacket, error } =
  useSensorSocket();
// Uses shared Socket.io connection and listens to env-configured events
```

**Don't duplicate these**—reuse from `hooks/` folder when possible.

## State Management

### Local State for UI

```javascript
const [isOpen, setIsOpen] = useState(false); // Local UI state only
const [formData, setFormData] = useState({ name: "", email: "" });
```

### Global Sensor State (SensorContext)

```javascript
import { useSensorContext } from "../context/SensorContext";

export default function Dashboard() {
  const { sensors, setSensors } = useSensorContext();
  // Use only for data needed by multiple pages/components
}
```

**Rule**: Local state for UI (modals, tabs, filters). Context for shared data (sensor list, device list).

When adding long-lived shared state, prefer updating `SensorContext` over introducing a second global store.

## TailwindCSS Styling

### ✅ Preferred (Utility Classes)

```javascript
<div className="flex gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
    Submit
  </button>
</div>
```

### ❌ Avoid (CSS Modules or Styled Components)

```javascript
// Don't create separate .css unless truly necessary
import styles from "./Component.module.css";
// Heavy overhead for this project size
```

### Common Classes

- **Spacing**: `p-4`, `m-2`, `gap-4` (padding, margin, gap)
- **Colors**: `bg-white`, `text-gray-600`, `border-gray-300`
- **Responsive**: `md:flex-row`, `sm:p-2` (mobile-first)
- **Hover/State**: `hover:bg-blue-600`, `disabled:opacity-50`

## Conditional Rendering

### ✅ Clean Patterns

```javascript
// Early return
if (loading) return <Skeleton />;
if (error) return <ErrorBoundary error={error} />;

// Ternary (simple)
{
  isOpen ? <Modal /> : null;
}

// && (show/hide)
{
  sensors.length > 0 && <SensorList sensors={sensors} />;
}
```

### ❌ Avoid

```javascript
// Nested ternaries (unreadable)
{
  isOpen ? sensors.length > 0 ? <Modal /> : <Empty /> : null;
}
```

## Props & Prop Drilling

**Avoid excessive prop drilling. Use Context for deeply nested data.**

### ❌ Excessive Drilling

```javascript
<Page sensors={sensors} onUpdate={onUpdate} filter={filter} />
  <Section sensors={sensors} onUpdate={onUpdate} filter={filter} />
    <List sensors={sensors} onUpdate={onUpdate} filter={filter} />
      <Item sensor={sensors[0]} onUpdate={onUpdate} />
```

### ✅ Use Context

```javascript
// SensorContext provides {sensors, onUpdate, filter}
<Page>
  <Section>
    <List>
      <Item /> {/* Access from context */}
    </List>
  </Section>
</Page>
```

## Error Handling in Components

```javascript
// Wrap at page level
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>;

// Handle API errors in hooks
const { data, error } = useApi("/sensors");
if (error) return <div className="text-red-600">{error.message}</div>;
```

Note: `services/api.js` returns response body directly (Axios interceptor).

- Direct service call (`api.get`) usually reads `response.data` for business payload.
- `useApi` returns the full response body in `data` state.

---

**Checklist before submitting code:**

- [ ] Only functional components (no class components)
- [ ] All hooks dependencies checked (run ESLint)
- [ ] `npm run lint` passes
- [ ] No prop drilling past 2 levels (use Context instead)
- [ ] TailwindCSS only (no separate CSS files unless absolutely necessary)
- [ ] Error states handled (loading, error, empty)
