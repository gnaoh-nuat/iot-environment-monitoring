import { useDashboardData } from "../hooks/useDashboardData";
import SensorPanel from "../components/dashboard/SensorPanel";
import DevicePanel from "../components/dashboard/DevicePanel";
import DashboardRealtimeChart from "../components/dashboard/DashboardRealtimeChart";

export default function Dashboard() {
  const {
    sensors,
    devices,
    loadingStates,
    chartData,
    dashboardError,
    isSensorOnline,
    handleDeviceToggle,
  } = useDashboardData();

  return (
    <div className="h-full min-h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      <aside className="w-1/4 flex flex-col gap-6 overflow-hidden pr-2 pb-2">
        {dashboardError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
            {dashboardError}
          </div>
        ) : null}

        <SensorPanel sensors={sensors} isSensorOnline={isSensorOnline} />

        <DevicePanel
          devices={devices}
          loadingStates={loadingStates}
          onToggleDevice={handleDeviceToggle}
        />
      </aside>

      <main className="flex-1 flex flex-col gap-6 overflow-hidden pr-2">
        <DashboardRealtimeChart sensors={sensors} chartData={chartData} />
      </main>
    </div>
  );
}
