
const PopUp = (props) => {
    const { closeModal, isModalOpen, children } = props;

    if (!isModalOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 backdrop-blur-sm  flex justify-center items-center">
            <div className="bg-slate-300 p-6 rounded-lg shadow-xl relative">
                <button
                    onClick={closeModal}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                    &times; 
                </button>

                {children}  
            </div>
        </div>
    );
}

export default PopUp