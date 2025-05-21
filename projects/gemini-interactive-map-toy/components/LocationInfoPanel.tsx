
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

interface LocationInfoPanelProps {
  info: string;
  isLoading: boolean;
  error: string | null;
  currentLocationName: string;
}

export const LocationInfoPanel: React.FC<LocationInfoPanelProps> = ({ info, isLoading, error, currentLocationName }) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-3">
        About: <span className="text-pink-300">{currentLocationName}</span>
      </h3>
      <div className="flex-grow overflow-y-auto p-1 rounded scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700 pr-2">
        {isLoading && <LoadingSpinner message={`Fetching info for ${currentLocationName}...`} />}
        {error && <ErrorDisplay message={error} />}
        {!isLoading && !error && info && (
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-base">{info}</p>
        )}
        {!isLoading && !error && !info && (
          <p className="text-slate-400 italic">Click "Get Info" to learn about {currentLocationName || "the current location"}.</p>
        )}
      </div>
    </div>
  );
};
