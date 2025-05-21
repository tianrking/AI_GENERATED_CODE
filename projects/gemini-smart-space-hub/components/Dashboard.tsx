

import React from 'react';
// Fix: Replaced MqttStatus with ConnectionStatus
import { Device, Room as RoomType, DeviceState, ConnectionStatus } from '../types';
import RoomCard from './RoomCard';
import Spinner from './ui/Spinner';
import { InfoIcon, WarningIcon, SuccessIcon } from '../constants';

interface DashboardProps {
  rooms: RoomType[];
  devices: Device[];
  onDeviceStateChange: (deviceId: string, newPartialState: Partial<DeviceState>) => void;
  // Fix: Replaced MqttStatus with ConnectionStatus
  mqttStatus: ConnectionStatus;
  isLoading: boolean;
}

// Fix: Replaced MqttStatus with ConnectionStatus
const Dashboard: React.FC<DashboardProps> = ({ rooms, devices, onDeviceStateChange, mqttStatus, isLoading }) => {
  if (isLoading && devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-4 text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-lg text-brand-text-secondary">Loading smart devices...</p>
      </div>
    );
  }

  const getStatusMessage = () => {
    let IconComponent;
    let textColor;
    let bgColor;
    let message;

    switch (mqttStatus) {
      case 'connected':
        IconComponent = SuccessIcon;
        textColor = 'text-green-700 dark:text-green-300';
        bgColor = 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600';
        message = 'Successfully connected. Device states are live (simulated).';
        break;
      case 'connecting':
      case 'reconnecting':
        IconComponent = InfoIcon;
        textColor = 'text-sky-700 dark:text-sky-300';
        bgColor = 'bg-sky-50 dark:bg-sky-900/30 border-sky-300 dark:border-sky-600';
        message = mqttStatus === 'connecting' ? 'Attempting to connect...' : 'Reconnecting...';
        break;
      case 'disconnected':
        IconComponent = WarningIcon;
        textColor = 'text-amber-700 dark:text-amber-300';
        bgColor = 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600';
        message = 'Disconnected. Controls are disabled. Please check configuration.';
        break;
      case 'error':
        IconComponent = WarningIcon;
        textColor = 'text-red-700 dark:text-red-300';
        bgColor = 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600';
        message = 'Error connecting. Please check configuration and console for details.';
        break;
      default:
        return null;
    }

    return (
      <div className={`p-4 mb-6 rounded-lg border ${bgColor} ${textColor} flex items-center`}>
        <IconComponent className="w-6 h-6 mr-3 flex-shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
    );
  };
  
  const devicesByRoom = (roomId: string) => devices.filter(d => d.room === roomId);


  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {getStatusMessage()}
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          devices={devicesByRoom(room.id)}
          onDeviceStateChange={onDeviceStateChange}
        />
      ))}
      {devices.length === 0 && !isLoading && mqttStatus !== 'connecting' && mqttStatus !== 'reconnecting' && (
         <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-brand-text-primary mb-2">No Devices Found</h2>
          <p className="text-brand-text-secondary">
            It seems there are no smart devices configured yet.
            <br/>
            Please check your configuration or add devices.
          </p>
        </div>
      )}
    </main>
  );
};

export default Dashboard;