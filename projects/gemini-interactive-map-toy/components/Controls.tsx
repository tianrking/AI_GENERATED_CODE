
import React, { useState } from 'react';
import { PanDirection } from '../types';

interface ControlsProps {
  currentLocationName: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (direction: PanDirection) => void;
  onSearchLocation: (locationName: string) => void;
  onGetRandomLocation: () => void;
  onGetInfo: () => void;
  isLoading: boolean;
}

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12V7.5h2.25l-2.25-2.25V3h-2.25v2.25L13.75 7.5h2.25v4.5h2.25ZM12.75 15h2.25l2.25 2.25V21h-2.25v-2.25L12.75 15Z" />
    </svg>
);


const InformationCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);


export const Controls: React.FC<ControlsProps> = ({
  currentLocationName,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onPan,
  onSearchLocation,
  onGetRandomLocation,
  onGetInfo,
  isLoading
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchLocation(searchInput.trim());
      setSearchInput('');
    }
  };

  const buttonBaseClass = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50";
  const primaryButtonClass = `${buttonBaseClass} bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500`;
  const secondaryButtonClass = `${buttonBaseClass} bg-slate-600 hover:bg-slate-500 text-slate-100 focus:ring-slate-400`;
  const disabledButtonClass = "opacity-50 cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-3">Map Controls</h2>
        
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
            <button onClick={onZoomIn} className={`${secondaryButtonClass} ${isLoading ? disabledButtonClass : ''}`} disabled={isLoading}><PlusIcon /> Zoom In</button>
            <button onClick={onZoomOut} className={`${secondaryButtonClass} ${isLoading ? disabledButtonClass : ''}`} disabled={isLoading}><MinusIcon /> Zoom Out</button>
            </div>
            <div className="text-center text-slate-300">Current Zoom: {zoomLevel}x</div>
        </div>

        <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onPan(PanDirection.PREVIOUS)} className={`${secondaryButtonClass} ${isLoading ? disabledButtonClass : ''}`} disabled={isLoading}><ArrowLeftIcon /> Prev Loc</button>
            <button onClick={() => onPan(PanDirection.NEXT)} className={`${secondaryButtonClass} ${isLoading ? disabledButtonClass : ''}`} disabled={isLoading}><ArrowRightIcon /> Next Loc</button>
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">Find Location</h3>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="E.g., Tokyo Tower"
            className="flex-grow p-2.5 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            disabled={isLoading}
          />
          <button type="submit" className={`${primaryButtonClass} ${isLoading ? disabledButtonClass : ''}`} disabled={isLoading}>Go</button>
        </form>
        <button 
            onClick={onGetRandomLocation} 
            className={`${secondaryButtonClass} w-full mt-3 ${isLoading ? disabledButtonClass : ''}`}
            disabled={isLoading}
        >
            <SparklesIcon /> Random Location
        </button>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">Location Info</h3>
         <p className="text-sm text-slate-400 mb-2">Current: <span className="font-semibold text-slate-200">{currentLocationName}</span></p>
        <button 
            onClick={onGetInfo} 
            className={`${primaryButtonClass} w-full ${isLoading ? disabledButtonClass : ''}`}
            disabled={isLoading || !currentLocationName}
        >
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fetching...
                </>
            ) : (
                <><InformationCircleIcon /> Get Info</>
            )}
        </button>
      </div>
    </div>
  );
};
