
import React from 'react';

interface MapDisplayProps {
  locationName: string;
  zoomLevel: number;
  mapSeed: string;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ locationName, zoomLevel, mapSeed }) => {
  const imageUrl = `https://picsum.photos/seed/${mapSeed}/800/600?blur=1`; // Added blur for abstract look

  // Dynamic border style based on zoom
  const zoomBorderStyle = {
    borderWidth: `${Math.min(2 + zoomLevel * 0.5, 8)}px`, // Example: border width increases with zoom
    borderColor: `rgba(165, 109, 255, ${0.5 + zoomLevel * 0.05})` // purple-400 with opacity tied to zoom
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-slate-700 rounded-lg overflow-hidden shadow-lg transition-all duration-300" style={zoomBorderStyle}>
      <img 
        src={imageUrl} 
        alt={`Conceptual map view of ${locationName}`} 
        className="absolute inset-0 w-full h-full object-cover" 
      />
      <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center p-4 pointer-events-none">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center shadow-strong break-words px-2" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
          {locationName}
        </h2>
        <p className="text-xl text-slate-200 mt-2 bg-slate-900 bg-opacity-60 px-3 py-1 rounded-md" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
          Zoom: {zoomLevel}x
        </p>
      </div>
    </div>
  );
};
