
import React, { useCallback } from 'react';
import { SwitchState, Device } from '../../types';
import Button from '../ui/Button';
import { SwitchIcon } from '../../constants';


interface SwitchControlProps {
  device: Device<SwitchState>;
  onStateChange: (deviceId: string, newPartialState: Partial<SwitchState>) => void;
}

const SwitchControl: React.FC<SwitchControlProps> = ({ device, onStateChange }) => {
  const { id, state } = device;

  const handleToggle = useCallback(() => {
    onStateChange(id, { isOn: !state.isOn });
  }, [id, state.isOn, onStateChange]);

  return (
    <div className="p-1">
      <Button
        onClick={handleToggle}
        variant={state.isOn ? 'primary' : 'secondary'}
        className="w-full"
        leftIcon={<SwitchIcon className={`w-5 h-5 ${state.isOn ? 'text-green-400' : ''}`} />}
      >
        {state.isOn ? 'Turn Off' : 'Turn On'}
      </Button>
    </div>
  );
};

export default SwitchControl;
