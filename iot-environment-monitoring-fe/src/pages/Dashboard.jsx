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
    <div className="h-full min-h-0 flex gap-4 overflow-hidden">
      <aside className="w-[34%] xl:w-[30%] min-h-0 flex flex-col gap-4 overflow-hidden pr-1">
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

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <DashboardRealtimeChart sensors={sensors} chartData={chartData} />
      </main>
    </div>
  );
}
