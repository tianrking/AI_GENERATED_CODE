
import React, { useState, useCallback } from 'react';
import { LightState, Device } from '../../types';
import { LightIcon } from '../../constants'; // Assuming LightIcon is the general one.
import Button from '../ui/Button';

interface LightControlProps {
  device: Device<LightState>;
  onStateChange: (deviceId: string, newPartialState: Partial<LightState>) => void;
}

const LightControl: React.FC<LightControlProps> = ({ device, onStateChange }) => {
  const { id, state } = device;
  const [internalColor, setInternalColor] = useState(state.color || '#ffffff');

  const handleToggle = useCallback(() => {
    onStateChange(id, { isOn: !state.isOn });
  }, [id, state.isOn, onStateChange]);

  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStateChange(id, { brightness: parseInt(e.target.value, 10) });
  }, [id, onStateChange]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalColor(e.target.value);
  };
  
  const applyColorChange = useCallback(() => {
     onStateChange(id, { color: internalColor });
  }, [id, internalColor, onStateChange]);


  return (
    <div className="space-y-4 p-1">
      <Button
        onClick={handleToggle}
        variant={state.isOn ? 'primary' : 'secondary'}
        className="w-full"
        leftIcon={<LightIcon className={`w-5 h-5 ${state.isOn ? 'text-yellow-300' : ''}`} />}
      >
        {state.isOn ? 'Turn Off' : 'Turn On'}
      </Button>

      {state.isOn && (
        <>
          {typeof state.brightness === 'number' && (
            <div className="space-y-1">
              <label htmlFor={`brightness-${id}`} className="block text-sm font-medium text-brand-text-secondary">
                Brightness: {state.brightness}%
              </label>
              <input
                type="range"
                id={`brightness-${id}`}
                min="0"
                max="100"
                value={state.brightness}
                onChange={handleBrightnessChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-brand-primary"
              />
            </div>
          )}

          {typeof state.color === 'string' && (
            <div className="space-y-1">
              <label htmlFor={`color-${id}`} className="block text-sm font-medium text-brand-text-secondary">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id={`color-${id}`}
                  value={internalColor}
                  onChange={handleColorChange}
                  className="p-0 h-10 w-16 rounded-md border-none cursor-pointer"
                />
                 <Button onClick={applyColorChange} size="sm" variant="outline">Apply Color</Button>
                <div className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600" style={{ backgroundColor: state.color }}></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LightControl;
