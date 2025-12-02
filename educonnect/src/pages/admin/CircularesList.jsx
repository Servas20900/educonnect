
import { Link } from "react-router-dom";

export default function CircularesList(){

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Circulares</h2>
        <Link to="/admin/circulares/new" className="btn">Nueva circular</Link>
      </div>
      <table className="w-full mt-4">
        <thead>
          <tr><th>Título</th><th>Estado</th><th>Programada</th><th>Acciones</th></tr>
        </thead>
       
      </table>
    </div>
  );
}
