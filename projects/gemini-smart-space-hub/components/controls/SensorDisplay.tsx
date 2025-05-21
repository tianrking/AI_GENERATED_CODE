
import React from 'react';
import { SensorState, Device } from '../../types';

interface SensorDisplayProps {
  device: Device<SensorState>;
}

const SensorDisplay: React.FC<SensorDisplayProps> = ({ device }) => {
  const { state } = device;

  return (
    <div className="p-2 space-y-2 text-sm text-brand-text-secondary bg-slate-50 dark:bg-slate-700 rounded-lg">
      {typeof state.temperature === 'number' && (
        <p>Temperature: <span className="font-semibold text-brand-text-primary">{state.temperature}°C</span></p>
      )}
      {typeof state.humidity === 'number' && (
        <p>Humidity: <span className="font-semibold text-brand-text-primary">{state.humidity}%</span></p>
      )}
      {typeof state.value !== 'undefined' && (
        <p>Value: <span className="font-semibold text-brand-text-primary">{state.value}{state.unit || ''}</span></p>
      )}
      {Object.keys(state).length === 0 && (
        <p className="italic">No sensor data available.</p>
      )}
    </div>
  );
};

export default SensorDisplay;
