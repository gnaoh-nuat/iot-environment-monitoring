import { Outlet } from "react-router-dom";
import { SensorProvider } from "./context/SensorContext";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <SensorProvider>
        <Outlet />
      </SensorProvider>
    </ErrorBoundary>
  );
}

export default App;
