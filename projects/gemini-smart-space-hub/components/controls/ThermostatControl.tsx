
import React, { useCallback } from 'react';
import { ThermostatState, Device } from '../../types';
import { TEMP_CELSIUS_MAX, TEMP_CELSIUS_MIN } from '../../constants';
import Button from '../ui/Button';

interface ThermostatControlProps {
  device: Device<ThermostatState>;
  onStateChange: (deviceId: string, newPartialState: Partial<ThermostatState>) => void;
}

const ThermostatControl: React.FC<ThermostatControlProps> = ({ device, onStateChange }) => {
  const { id, state } = device;

  const handleToggle = useCallback(() => {
    onStateChange(id, { isOn: !state.isOn, mode: !state.isOn ? 'cool' : 'off' });
  }, [id, state.isOn, onStateChange]);

  const handleTemperatureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStateChange(id, { targetTemperature: parseInt(e.target.value, 10) });
  }, [id, onStateChange]);

  const handleModeChange = useCallback((newMode: ThermostatState['mode']) => {
    onStateChange(id, { mode: newMode, isOn: newMode !== 'off' });
  }, [id, onStateChange]);

  const modes: ThermostatState['mode'][] = ['cool', 'heat', 'fan', 'off'];

  return (
    <div className="space-y-4 p-1">
      <Button
        onClick={handleToggle}
        variant={state.isOn ? 'primary' : 'secondary'}
        className="w-full"
      >
        {state.isOn ? `Turn Off (Currently ${state.mode})` : 'Turn On'}
      </Button>

      {state.isOn && (
        <>
          <div>
            <label htmlFor={`temp-${id}`} className="block text-sm font-medium text-brand-text-secondary">
              Target Temp: {state.targetTemperature}°C (Current: {state.temperature}°C)
            </label>
            <input
              type="range"
              id={`temp-${id}`}
              min={TEMP_CELSIUS_MIN}
              max={TEMP_CELSIUS_MAX}
              value={state.targetTemperature}
              onChange={handleTemperatureChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-brand-primary"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-brand-text-secondary mb-1">Mode</span>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((modeName) => (
                <Button
                  key={modeName}
                  variant={state.mode === modeName ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange(modeName)}
                >
                  {modeName.charAt(0).toUpperCase() + modeName.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThermostatControl;
