export default function Toast({ information, setInformation }) {
  if (!information) return null;

  const isSuccess = information.toLowerCase().includes('xito');

  return (
    <div className="fixed bottom-5 right-5 z-[1300] animate-bounce">
      <div
        className={`flex items-center rounded-lg border-l-4 p-4 shadow-xl transition-all duration-300 ${
          isSuccess
            ? 'border-green-500 bg-green-100 text-green-700'
            : 'border-red-500 bg-red-100 text-red-700'
        }`}
      >
        <p className="text-sm font-bold">{information}</p>
        <button
          onClick={() => setInformation('')}
          className="ml-4 font-bold text-gray-400 hover:text-gray-600"
        >
          x
        </button>
      </div>
    </div>
  );
}
