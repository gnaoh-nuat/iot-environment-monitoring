const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        Dashboard Overview
      </h1>
      {/* Chỗ này sau sẽ nhúng Component Chart và Sensor Card vào */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm h-40">
          Sensor Temperature
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm h-40">
          Sensor Humidity
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm h-40">
          Sensor Light
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
