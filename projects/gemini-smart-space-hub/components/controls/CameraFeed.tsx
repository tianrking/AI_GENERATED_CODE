
import React from 'react';
import { CameraState, Device } from '../../types';
import Button from '../ui/Button';

interface CameraFeedProps {
  device: Device<CameraState>;
  onStateChange: (deviceId: string, newPartialState: Partial<CameraState>) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ device, onStateChange }) => {
  const { id, state } = device;

  const toggleStream = () => {
    onStateChange(id, { isStreaming: !state.isStreaming });
  };
  
  const placeholderUrl = `https://picsum.photos/seed/${id}/400/300`;

  return (
    <div className="space-y-2 p-1">
      <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden flex items-center justify-center">
        {state.isStreaming ? (
          <img 
            src={state.streamUrl || placeholderUrl} 
            alt={`${device.name} feed`} 
            className="w-full h-full object-cover" 
            onError={(e) => (e.currentTarget.src = placeholderUrl)} // Fallback if streamUrl fails
          />
        ) : (
          <p className="text-brand-text-secondary text-sm">Camera feed is off</p>
        )}
      </div>
      <Button onClick={toggleStream} variant={state.isStreaming ? 'danger' : 'primary'} size="sm" className="w-full">
        {state.isStreaming ? 'Stop Stream' : 'Start Stream'}
      </Button>
    </div>
  );
};

export default CameraFeed;
