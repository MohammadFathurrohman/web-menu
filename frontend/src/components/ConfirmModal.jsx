export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 dark:text-gray-200 text-lg font-medium">{message}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition shadow-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
