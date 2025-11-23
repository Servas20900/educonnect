
export default function Dashboard(){

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">Estadística 1</div>
        <div className="p-4 bg-white rounded shadow">Estadística 2</div>
        <div className="p-4 bg-white rounded shadow">Estadística 3</div>
      </div>
    </div>
  );
}
