export default function Toast({ information, setInformation }) {
    if (!information) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
            <div className={`flex items-center p-4 rounded-lg shadow-xl border-l-4 transition-all duration-300 ${
                information.includes("xito")
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-red-100 border-red-500 text-red-700"
            }`}>
                <span className="mr-2">
                    {information.includes("xito") ? "✅" : "⚠️"}
                </span>
                <p className="font-bold text-sm">
                    {information}
                </p>
                <button
                    onClick={() => setInformation("")}
                    className="ml-4 text-gray-400 hover:text-gray-600 font-bold"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}