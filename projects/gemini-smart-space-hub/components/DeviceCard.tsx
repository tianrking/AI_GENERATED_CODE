
import React, { useState } from 'react';
import { Device, DeviceState, DeviceType, LightState, ThermostatState, SwitchState, SensorState, CameraState } from '../types';
import LightControl from './controls/LightControl';
import ThermostatControl from './controls/ThermostatControl';
import SwitchControl from './controls/SwitchControl';
import SensorDisplay from './controls/SensorDisplay';
import CameraFeed from './controls/CameraFeed';
import { ChevronDown } from '../constants';

interface DeviceCardProps {
  device: Device;
  onStateChange: (deviceId: string, newPartialState: Partial<DeviceState>) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onStateChange }) => {
  const [isExpanded, setIsExpanded] = useState(false); // For controls that might be collapsible

  const DeviceIcon = device.icon;

  const renderControls = () => {
    switch (device.type) {
      case DeviceType.Light:
        return <LightControl device={device as Device<LightState>} onStateChange={onStateChange as any} />;
      case DeviceType.Thermostat:
        return <ThermostatControl device={device as Device<ThermostatState>} onStateChange={onStateChange as any} />;
      case DeviceType.Switch:
        return <SwitchControl device={device as Device<SwitchState>} onStateChange={onStateChange as any} />;
      case DeviceType.Sensor:
        return <SensorDisplay device={device as Device<SensorState>} />;
      case DeviceType.Camera:
        return <CameraFeed device={device as Device<CameraState>} onStateChange={onStateChange as any} />;
      default:
        return <p className="text-sm text-slate-500">No controls available for this device type.</p>;
    }
  };
  
  const canExpand = device.type === DeviceType.Light || device.type === DeviceType.Thermostat || device.type === DeviceType.Camera;

  const getStatusIndicator = () => {
    let isActive = false;
    if ('isOn' in device.state) {
      isActive = (device.state as LightState | SwitchState | ThermostatState).isOn;
    } else if ('isStreaming' in device.state) {
      isActive = (device.state as CameraState).isStreaming;
    } else if (device.type === DeviceType.Sensor) {
      // Sensors are always "active" if they have data
      isActive = Object.keys(device.state).length > 0;
    }
    
    return (
      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}
           title={isActive ? 'Active' : 'Inactive'}>
      </div>
    );
  };


  return (
    <div className="bg-brand-surface rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
             <DeviceIcon className="w-8 h-8 text-brand-primary mr-3" />
            <div>
                <h3 className="text-lg font-semibold text-brand-text-primary">{device.name}</h3>
                <p className="text-xs text-brand-text-secondary">{device.type}</p>
            </div>
          </div>
          {getStatusIndicator()}
        </div>

        {/* Collapsible controls section */}
        {canExpand && (
           <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="w-full flex justify-between items-center text-left text-sm font-medium text-brand-primary hover:text-brand-secondary py-2 mb-2"
            aria-expanded={isExpanded}
            aria-controls={`controls-${device.id}`}
          >
            <span>{isExpanded ? 'Hide Controls' : 'Show Controls'}</span>
            <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        
        {(!canExpand || isExpanded) && (
          <div id={`controls-${device.id}`} className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen opacity-100 mt-2' : canExpand ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'}`}>
            {renderControls()}
          </div>
        )}
         {/* Always show sensor display if it's a sensor and not expandable */}
        {device.type === DeviceType.Sensor && !canExpand && renderControls()}
        {device.type === DeviceType.Switch && !canExpand && renderControls()}

      </div>
    </div>
  );
};

export default DeviceCard;
