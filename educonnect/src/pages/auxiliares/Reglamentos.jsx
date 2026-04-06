import InformesEconomicos from './informesEconomicos';

export default function Reglamentos() {
  return (
    <InformesEconomicos
      moduleTitle="Reglamentos Auxiliares"
      moduleSubtitle="Registrar, visualizar, descargar y archivar reglamentos"
      createLabel="Nuevo Reglamento"
      fixedCategoria="reglamento"
      showCategoriaFilter={false}
      searchPlaceholder="Buscar reglamentos por titulo o responsable"
    />
  );
}