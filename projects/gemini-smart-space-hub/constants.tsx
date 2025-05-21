import React from 'react';
import { SunIcon as HeroSunIcon, VariableIcon as HeroVariableIcon, PowerIcon as HeroPowerIcon, CpuChipIcon as HeroCpuChipIcon, VideoCameraIcon as HeroVideoCameraIcon, Cog6ToothIcon as HeroCog6ToothIcon, LightBulbIcon as HeroLightBulbIcon, AdjustmentsHorizontalIcon as HeroAdjustmentsHorizontalIcon, WifiIcon as HeroWifiIcon, XMarkIcon as HeroXMarkIcon, ChevronDownIcon as HeroChevronDownIcon, MoonIcon as HeroMoonIcon, InformationCircleIcon as HeroInformationCircleIcon, ExclamationTriangleIcon as HeroExclamationTriangleIcon, CheckCircleIcon as HeroCheckCircleIcon } from '@heroicons/react/24/outline';

export const LightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroLightBulbIcon {...props} />;
export const ThermostatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroVariableIcon {...props} />;
export const SwitchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroPowerIcon {...props} />;
export const SensorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCpuChipIcon {...props} />;
export const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroVideoCameraIcon {...props} />;
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCog6ToothIcon {...props} />;
export const AdjustmentsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroAdjustmentsHorizontalIcon {...props} />;
export const WifiConnectionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroWifiIcon {...props} />;
export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroXMarkIcon {...props} />;
export const ChevronDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroChevronDownIcon {...props} />;
export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroSunIcon {...props} />;
export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroMoonIcon {...props} />;
export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroInformationCircleIcon {...props} />;
export const WarningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroExclamationTriangleIcon {...props} />;
export const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCheckCircleIcon {...props} />;


export const DEFAULT_MQTT_BROKER_PORT = 1883;
export const DEFAULT_MQTT_WS_PORT = 9001; // Common for MQTT over WebSockets

export const DEFAULT_HA_API_URL = 'http://192.168.2.2:8123'; // Assuming HA is on this IP and default port
export const DEFAULT_HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlM2RmNmI3ODFhZTk0ZjFmODUwNmRlMGJmNWEzNmYzYiIsImlhdCI6MTc0Nzc5Mzk1MiwiZXhwIjoyMDYzMTUzOTUyfQ.lpLOWOlhM-ShsHnvrel0kJoP9Senx_pIfBd5vMxg8II';


export const INITIAL_ROOMS: { id: string; name: string }[] = [
  { id: 'living-room', name: '客厅 (Living Room)' },
  { id: 'bedroom', name: '卧室 (Bedroom)' },
  { id: 'kitchen', name: '厨房 (Kitchen)' },
  { id: 'office', name: '办公室 (Office)' },
];

export const TEMP_CELSIUS_MIN = -10;
export const TEMP_CELSIUS_MAX = 40;
export const BRIGHTNESS_MIN = 0;
export const BRIGHTNESS_MAX = 100;