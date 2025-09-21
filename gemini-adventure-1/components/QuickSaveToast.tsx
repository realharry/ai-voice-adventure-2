import React from 'react';

interface QuickSaveToastProps {
  show: boolean;
}

const QuickSaveToast: React.FC<QuickSaveToastProps> = ({ show }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-xl toast-animation">
      Game Saved
    </div>
  );
};

export default QuickSaveToast;
