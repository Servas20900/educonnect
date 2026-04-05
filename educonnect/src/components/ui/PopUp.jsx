const PopUp = ({ closeModal, isModalOpen, children }) => {
  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
      <div className="relative rounded-lg bg-slate-300 p-6 shadow-xl">
        <button
          onClick={closeModal}
          className="absolute right-2 top-2 cursor-pointer text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  );
};

export default PopUp;
