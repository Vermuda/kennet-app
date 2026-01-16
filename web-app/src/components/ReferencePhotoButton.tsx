import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ReferencePhotoButtonProps {
  propertyId: string;
}

const ReferencePhotoButton: React.FC<ReferencePhotoButtonProps> = ({ propertyId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/camera/reference', {
      state: {
        propertyId,
        returnPath: window.location.pathname,
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      className="group fixed bottom-8 right-8
        bg-emerald-600
        text-white px-4 py-3 rounded-2xl
        shadow-2xl shadow-emerald-600/50
        hover:shadow-[0_0_40px_rgba(5,150,105,0.6)]
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        z-50
        ring-4 ring-emerald-200/50 hover:ring-emerald-300/70
        border-2 border-white/20
        backdrop-blur-sm
        hover:bg-emerald-700
        flex flex-col items-center gap-1"
      title="通常撮影"
      aria-label="通常撮影を開始"
    >
      {/* カメラアイコン - 回転アニメーション */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      
      {/* テキストラベル */}
      <span className="text-xs font-bold whitespace-nowrap">通常撮影</span>

      {/* パルスエフェクト */}
      <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
    </button>
  );
};

export default ReferencePhotoButton;
