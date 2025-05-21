
import React from 'react';
import { Device, Room as RoomType, DeviceState } from '../types';
import DeviceCard from './DeviceCard';

interface RoomCardProps {
  room: RoomType;
  devices: Device[];
  onDeviceStateChange: (deviceId: string, newPartialState: Partial<DeviceState>) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, devices, onDeviceStateChange }) => {
  if (devices.length === 0) {
    return null; // Don't render room card if no devices
  }

  return (
    <section aria-labelledby={`room-title-${room.id}`} className="mb-12">
      <h2 id={`room-title-${room.id}`} className="text-3xl font-bold text-brand-text-primary mb-6 pb-2 border-b-2 border-brand-primary/30">
        {room.name}
      </h2>
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} onStateChange={onDeviceStateChange} />
          ))}
        </div>
      ) : (
        <p className="text-brand-text-secondary italic">No devices in this room.</p>
      )}
    </section>
  );
};

export default RoomCard;
