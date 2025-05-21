

import React from 'react';
import { SettingsIcon, WifiConnectionIcon, AdjustmentsIcon } from '../constants';
// Fix: Replaced MqttStatus with ConnectionStatus
import { ConnectionStatus, Theme } from '../types';
import ThemeToggle from './ui/ThemeToggle';
import Button from './ui/Button';

interface NavbarProps {
  onToggleConfig: () => void;
  // Fix: Replaced MqttStatus with ConnectionStatus
  mqttStatus: ConnectionStatus;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

// Fix: Replaced MqttStatus with ConnectionStatus
const Navbar: React.FC<NavbarProps> = ({ onToggleConfig, mqttStatus, currentTheme, onThemeChange }) => {
  const getStatusColor = () => {
    switch (mqttStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-500 animate-pulse-fast';
      case 'disconnected':
        return 'text-slate-400';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <nav className="bg-brand-surface shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <AdjustmentsIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="ml-3 text-2xl font-bold text-brand-text-primary tracking-tight">
              智能空间<span className="text-brand-primary">交互中心</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center" title={`MQTT Status: ${mqttStatus}`}>
              <WifiConnectionIcon className={`h-6 w-6 ${getStatusColor()} transition-colors duration-300`} />
              <span className={`ml-2 text-sm font-medium ${getStatusColor()} hidden sm:inline`}>
                {mqttStatus.charAt(0).toUpperCase() + mqttStatus.slice(1)}
              </span>
            </div>
            <ThemeToggle currentTheme={currentTheme} onThemeChange={onThemeChange} />
            <Button 
              variant="ghost"
              size="md"
              onClick={onToggleConfig} 
              aria-label="Open settings"
              className="p-2 !text-brand-text-secondary hover:!text-brand-primary"
            >
              <SettingsIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;