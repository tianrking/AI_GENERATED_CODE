import React from 'react';

export enum DeviceType {
  Light = 'Light',
  Thermostat = 'Thermostat',
  Switch = 'Switch',
  Sensor = 'Sensor',
  Camera = 'Camera',
}

export interface LightState {
  isOn: boolean;
  brightness?: number; // 0-100
  color?: string; // hex color
}

export interface ThermostatState {
  isOn: boolean;
  temperature: number; // Celsius
  targetTemperature: number;
  mode: 'cool' | 'heat' | 'fan' | 'off';
}

export interface SwitchState {
  isOn: boolean;
}

export interface SensorState {
  temperature?: number; // Celsius
  humidity?: number; // %
  value?: string | number; // Generic sensor value
  unit?: string;
}

export interface CameraState {
  isStreaming: boolean;
  streamUrl?: string;
}

export type DeviceState = LightState | ThermostatState | SwitchState | SensorState | CameraState;

export interface Device<S extends DeviceState = DeviceState> {
  id: string;
  name: string;
  type: DeviceType;
  room: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  state: S;
  topic?: string; // MQTT topic for this device
  entityId?: string; // Home Assistant entity ID
}

export interface Room {
  id: string;
  name: string;
}

export interface MqttConnectionConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  clientId?: string;
}

export interface HomeAssistantApiConfig {
  url: string;
  token: string;
}

export type ControlMethod = 'mqtt' | 'home_assistant_api';

export interface AppConfiguration {
  controlMethod: ControlMethod;
  mqtt: MqttConnectionConfig;
  homeAssistant: HomeAssistantApiConfig;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export type Theme = 'light' | 'dark';

// For Home Assistant API responses
export interface HAState {
  entity_id: string;
  state: string; // 'on', 'off', 'unavailable', temperature value, etc.
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}