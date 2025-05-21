
import React, { useState, useCallback, useEffect } from 'react';
import { Controls } from './components/Controls';
import { MapDisplay } from './components/MapDisplay';
import { LocationInfoPanel } from './components/LocationInfoPanel';
import { fetchLocationInfo } from './services/geminiService';
import { INITIAL_LOCATION_NAME, INITIAL_ZOOM_LEVEL, PREDEFINED_LOCATIONS, ZOOM_STEP, MAX_ZOOM, MIN_ZOOM } from './constants';
import { PanDirection } from './types';

const App: React.FC = () => {
  const [currentLocationName, setCurrentLocationName] = useState<string>(INITIAL_LOCATION_NAME);
  const [currentLocationIndex, setCurrentLocationIndex] = useState<number>(
    PREDEFINED_LOCATIONS.indexOf(INITIAL_LOCATION_NAME) !== -1 ? PREDEFINED_LOCATIONS.indexOf(INITIAL_LOCATION_NAME) : 0
  );
  const [zoomLevel, setZoomLevel] = useState<number>(INITIAL_ZOOM_LEVEL);
  const [locationInfo, setLocationInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapSeed, setMapSeed] = useState<string>(INITIAL_LOCATION_NAME.replace(/\s+/g, '_').toLowerCase());

  useEffect(() => {
    setMapSeed(currentLocationName.replace(/\s+/g, '_').toLowerCase());
  }, [currentLocationName]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const updateLocation = useCallback((newLocationName: string) => {
    setCurrentLocationName(newLocationName);
    setLocationInfo('');
    setError(null);
    const predefinedIndex = PREDEFINED_LOCATIONS.indexOf(newLocationName);
    if (predefinedIndex !== -1) {
      setCurrentLocationIndex(predefinedIndex);
    }
    // Optionally, auto-fetch info on location change:
    // handleGetInfo(newLocationName); 
  }, []);


  const handlePan = useCallback((direction: PanDirection) => {
    let newIndex = currentLocationIndex;
    if (direction === PanDirection.NEXT) {
      newIndex = (currentLocationIndex + 1) % PREDEFINED_LOCATIONS.length;
    } else if (direction === PanDirection.PREVIOUS) {
      newIndex = (currentLocationIndex - 1 + PREDEFINED_LOCATIONS.length) % PREDEFINED_LOCATIONS.length;
    }
    setCurrentLocationIndex(newIndex);
    updateLocation(PREDEFINED_LOCATIONS[newIndex]);
  }, [currentLocationIndex, updateLocation]);

  const handleSearchLocation = useCallback((locationName: string) => {
    if (locationName.trim()) {
      updateLocation(locationName.trim());
    }
  }, [updateLocation]);

  const handleGetRandomLocation = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * PREDEFINED_LOCATIONS.length);
    setCurrentLocationIndex(randomIndex);
    updateLocation(PREDEFINED_LOCATIONS[randomIndex]);
  }, [updateLocation]);

  const handleGetInfo = useCallback(async (locationToFetch?: string) => {
    const targetLocation = locationToFetch || currentLocationName;
    if (!targetLocation) return;

    setIsLoading(true);
    setError(null);
    setLocationInfo('');
    try {
      const info = await fetchLocationInfo(targetLocation);
      setLocationInfo(info);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      setLocationInfo('');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocationName]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          Interactive Map Toy
        </h1>
        <p className="text-slate-400 mt-2">Explore places and get fun facts!</p>
      </header>

      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-1/3 bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
          <Controls
            currentLocationName={currentLocationName}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPan={handlePan}
            onSearchLocation={handleSearchLocation}
            onGetRandomLocation={handleGetRandomLocation}
            onGetInfo={() => handleGetInfo()}
            isLoading={isLoading}
          />
        </aside>

        <section className="lg:w-2/3 flex flex-col gap-6">
          <div className="bg-slate-800 p-1 rounded-xl shadow-2xl border border-slate-700">
            <MapDisplay locationName={currentLocationName} zoomLevel={zoomLevel} mapSeed={mapSeed} />
          </div>
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 min-h-[200px]">
            <LocationInfoPanel
              info={locationInfo}
              isLoading={isLoading && !error} // Only show loading if not also an error
              error={error}
              currentLocationName={currentLocationName}
            />
          </div>
        </section>
      </main>
      <footer className="w-full max-w-6xl mt-8 text-center text-slate-500 text-sm">
        <p>Powered by React, Tailwind CSS, and Gemini API.</p>
         {/* process.env.API_KEY is used internally and not displayed or managed by UI */}
      </footer>
    </div>
  );
};

export default App;
