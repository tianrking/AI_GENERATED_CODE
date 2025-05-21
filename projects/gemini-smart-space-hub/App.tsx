

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ConfigPanel from './components/ConfigPanel';
// Fix: Replaced MqttConfig with MqttConnectionConfig and MqttStatus with ConnectionStatus
import { Device, Room, MqttConnectionConfig, DeviceState, ConnectionStatus, DeviceType, LightState, ThermostatState, SwitchState, SensorState, CameraState, Theme, AppConfiguration } from './types';
// Fix: Replaced DEFAULT_MQTT_PORT with DEFAULT_MQTT_BROKER_PORT
import { LightIcon, ThermostatIcon, SwitchIcon, SensorIcon, CameraIcon, INITIAL_ROOMS, DEFAULT_MQTT_BROKER_PORT, DEFAULT_MQTT_WS_PORT } from './constants';
import mockMqttService from './services/mqttService';

const initialDevices: Device[] = [
  // Existing devices
  { id: 'lr-light-1', name: '主吊灯', type: DeviceType.Light, room: 'living-room', icon: LightIcon, state: { isOn: false, brightness: 80, color: '#FFD700' }, topic: 'home/living-room/main-light' },
  { id: 'lr-thermostat-1', name: '空调', type: DeviceType.Thermostat, room: 'living-room', icon: ThermostatIcon, state: { isOn: true, temperature: 22, targetTemperature: 24, mode: 'cool' }, topic: 'home/living-room/thermostat' },
  { id: 'lr-tv-switch', name: '电视插座', type: DeviceType.Switch, room: 'living-room', icon: SwitchIcon, state: { isOn: true }, topic: 'home/living-room/tv-switch' }, // Assuming this is a generic JSON switch
  { id: 'br-light-1', name: '床头灯', type: DeviceType.Light, room: 'bedroom', icon: LightIcon, state: { isOn: true, brightness: 50, color: '#ADD8E6' }, topic: 'home/bedroom/bedside-light' },
  { id: 'br-sensor-1', name: '环境传感器', type: DeviceType.Sensor, room: 'bedroom', icon: SensorIcon, state: { temperature: 22.5, humidity: 55 }, topic: 'home/bedroom/env-sensor' },
  { id: 'kt-light-1', name: '橱柜灯', type: DeviceType.Light, room: 'kitchen', icon: LightIcon, state: {isOn: false, brightness: 100, color: '#FFFFFF'}, topic: 'home/kitchen/cabinet-light' },
  { id: 'kt-cam-1', name: '监控摄像头', type: DeviceType.Camera, room: 'kitchen', icon: CameraIcon, state: {isStreaming: false, streamUrl: `https://picsum.photos/seed/kt-cam-1/400/300`}, topic: 'home/kitchen/camera1' },
  { id: 'of-desk-light', name: '办公桌灯', type: DeviceType.Light, room: 'office', icon: LightIcon, state: {isOn: false, brightness: 70, color: '#FFFACD'}, topic: 'home/office/desk-light' },
  
  // Home Assistant relays from Arduino sketch
  { 
    id: 'ha-relay-1', 
    name: 'HA Relay 1 (D0)', 
    type: DeviceType.Switch, 
    room: 'living-room', // Or any other suitable room
    icon: SwitchIcon, 
    state: { isOn: false }, 
    topic: 's3w0x7ceswitch/switch/relay1' // Base topic for this relay
  },
  { 
    id: 'ha-relay-2', 
    name: 'HA Relay 2 (D1)', 
    type: DeviceType.Switch, 
    room: 'living-room', // Or any other suitable room
    icon: SwitchIcon, 
    state: { isOn: false }, 
    topic: 's3w0x7ceswitch/switch/relay2' // Base topic for this relay
  },
   // Original office plug - ensure its topic is distinct if it's also a switch type.
  { id: 'of-plug', name: '智能插座 (Office)', type: DeviceType.Switch, room: 'office', icon: SwitchIcon, state: {isOn: false}, topic: 'home/office/smart-plug' },
];

// Default App Configuration
const defaultAppConfig: AppConfiguration = {
  controlMethod: 'mqtt',
  mqtt: {
    brokerUrl: 'ws://192.168.2.2', // Default to your HA broker IP with WebSocket
    port: DEFAULT_MQTT_WS_PORT,    // Default WebSocket port (9001)
    username: '',                  // From your sketch
    password: '',                  // From your sketch
    clientId: `smart_space_hub_${Math.random().toString(16).substr(2, 8)}`
  },
  homeAssistant: {
    url: 'http://localhost:8123', // A sensible default
    token: ''
  }
};


const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [rooms] = useState<Room[]>(INITIAL_ROOMS);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  // Fix: Use AppConfiguration for the entire app configuration
  const [appConfig, setAppConfig] = useState<AppConfiguration>(() => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Ensure old MqttConfig is migrated to AppConfiguration format
      if (parsed.brokerUrl) { // Old format detected
        return {
          ...defaultAppConfig, // Start with defaults
          mqtt: { // Populate MQTT from old config
            brokerUrl: parsed.brokerUrl,
            port: parsed.port || (parsed.brokerUrl.startsWith('ws') ? DEFAULT_MQTT_WS_PORT : DEFAULT_MQTT_BROKER_PORT),
            username: parsed.username || '',
            password: parsed.password || '',
            clientId: parsed.clientId || `smart_space_hub_${Math.random().toString(16).substr(2, 8)}`
          },
          // Keep HA defaults or allow them to be set fresh
        };
      }
      return { ...defaultAppConfig, ...parsed }; // New format
    }
    return defaultAppConfig;
  });
  // Fix: Replaced MqttStatus with ConnectionStatus
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
  };
  
  const handleMqttMessage = useCallback((topic: string, payload: string) => {
    console.log(`MQTT Message Received: ${topic}`, payload);
    
    const deviceToUpdate = devices.find(d => d.topic && topic === `${d.topic}/state`);

    if (deviceToUpdate) {
      let newPartialState: Partial<DeviceState> | null = null;

      if (deviceToUpdate.type === DeviceType.Switch && 
         (deviceToUpdate.id === 'ha-relay-1' || deviceToUpdate.id === 'ha-relay-2')) {
        newPartialState = { isOn: payload.toUpperCase() === "ON" };
      } else {
        try {
          newPartialState = JSON.parse(payload) as Partial<DeviceState>;
        } catch (error) {
          if (deviceToUpdate.type === DeviceType.Switch && (payload.toUpperCase() === "ON" || payload.toUpperCase() === "OFF")) {
            newPartialState = { isOn: payload.toUpperCase() === "ON" };
          } else {
            console.warn(`Failed to parse JSON payload for topic ${topic}, or unhandled non-JSON payload:`, payload, error);
          }
        }
      }

      if (newPartialState) {
        setDevices(prevDevices =>
          prevDevices.map(d =>
            d.id === deviceToUpdate.id ? { ...d, state: { ...d.state, ...newPartialState } } : d
          )
        );
      }
    } else if (topic === "smart_home/status" && payload.includes("Successfully connected")) {
       try {
        const messageData = JSON.parse(payload);
        if (messageData.message) console.info("General MQTT Status:", messageData.message);
       } catch (e) {
         console.info("General MQTT Status (raw):", payload);
       }
    }
  }, [devices]); 

  useEffect(() => {
    // Fix: Use ConnectionStatus for mockMqttService.onStatusChange
    mockMqttService.onStatusChange(setConnectionStatus);
    mockMqttService.onMessage(handleMqttMessage);
    
    // Fix: Use appConfig.mqtt for MQTT connection details
    if (appConfig.controlMethod === 'mqtt' && appConfig.mqtt.brokerUrl) {
      connect();
    } else {
      setIsLoadingDevices(false);
    }

    return () => {
      // Cleanup
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMqttMessage, appConfig.controlMethod]); // connect and appConfig.mqtt.brokerUrl changes are handled by user actions / other effects

  const connect = useCallback(async () => {
    if (appConfig.controlMethod === 'mqtt') {
      if (!appConfig.mqtt.brokerUrl) {
        // Fix: Use ConnectionStatus for setConnectionStatus
        setConnectionStatus('error');
        console.error("MQTT Connection failed: Broker URL is not set.");
        setIsLoadingDevices(false);
        return;
      }
      setIsLoadingDevices(true);
      try {
        await mockMqttService.connect(appConfig.mqtt);
        devices.forEach(device => {
          if (device.topic) {
            mockMqttService.subscribe(`${device.topic}/state`); 
          }
        });
      } catch (error) {
        console.error('MQTT Connection failed:', error);
        mockMqttService.tryReconnect(appConfig.mqtt);
      } finally {
        setTimeout(() => setIsLoadingDevices(false), 500);
      }
    } else if (appConfig.controlMethod === 'home_assistant_api') {
      // Placeholder for HA API connection logic if needed at app start
      // For now, HA connections are typically per-request.
      // We can simulate a "connection check" here if desired.
      setConnectionStatus('connected'); // Assume HA API is available if selected
      setIsLoadingDevices(false);
    }
  }, [appConfig, devices]);

  const disconnect = useCallback(async () => {
    if (appConfig.controlMethod === 'mqtt') {
      await mockMqttService.disconnect();
    } else if (appConfig.controlMethod === 'home_assistant_api') {
      // For HA API, "disconnect" usually means clearing tokens or stopping polling,
      // but here it's simpler as we don't maintain a persistent HA connection.
      // Fix: Use ConnectionStatus for setConnectionStatus
      setConnectionStatus('disconnected');
    }
  }, [appConfig.controlMethod]);

  // Fix: handleSaveConfig should accept AppConfiguration
  const handleSaveConfig = useCallback(async (newConfig: AppConfiguration) => {
    const oldAppConfig = appConfig;
    setAppConfig(newConfig);
    localStorage.setItem('appConfig', JSON.stringify(newConfig));
    
    if (newConfig.controlMethod === 'mqtt') {
      const oldMqttConfig = oldAppConfig.mqtt;
      const newMqttConfig = newConfig.mqtt;
      // Fix: Use ConnectionStatus for connectionStatus check
      if (connectionStatus === 'connected' && (newMqttConfig.brokerUrl !== oldMqttConfig.brokerUrl || newMqttConfig.port !== oldMqttConfig.port)) {
          await mockMqttService.disconnect();
          // Connection will be re-attempted by onConnect in ConfigPanel or user action
      // Fix: Use ConnectionStatus for connectionStatus check
      } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
         // Allow onConnect in ConfigPanel to handle connection attempt if MQTT is selected
      }
    } else if (newConfig.controlMethod === 'home_assistant_api') {
        // If switching to HA_API or changing HA settings, we might want to "reconnect" or validate
        // For now, if it was connected via MQTT, disconnect it.
        if (oldAppConfig.controlMethod === 'mqtt' && connectionStatus === 'connected') {
             await mockMqttService.disconnect();
        }
        // HA doesn't have a persistent "connect" like MQTT in this app, so set status accordingly.
        // A connection check could be performed here. For simplicity, assume 'disconnected' until an action.
        // Or, if settings are valid, 'connected'. Let's assume disconnected until a successful call or manual connect.
        if(connectionStatus !== 'disconnected') setConnectionStatus('disconnected');
    }
  }, [appConfig, connectionStatus]);


  const handleDeviceStateChange = useCallback((deviceId: string, newPartialState: Partial<DeviceState>) => {
    setDevices(prevDevices =>
      prevDevices.map(d =>
        d.id === deviceId ? { ...d, state: { ...d.state, ...newPartialState } } : d
      )
    );

    const device = devices.find(d => d.id === deviceId);
    // Fix: Use ConnectionStatus for connectionStatus check
    if (device && appConfig.controlMethod === 'mqtt' && device.topic && (connectionStatus === 'connected')) {
      let commandPayload: string;
      let commandTopicSuffix: string;

      if (device.type === DeviceType.Switch && (device.id === 'ha-relay-1' || device.id === 'ha-relay-2')) {
        commandPayload = (newPartialState as SwitchState).isOn ? "ON" : "OFF";
        commandTopicSuffix = "/command";
      } else if (device.type === DeviceType.Switch) {
        commandPayload = JSON.stringify(newPartialState); 
        commandTopicSuffix = "/set";
      }
      else {
        commandPayload = JSON.stringify(newPartialState);
        commandTopicSuffix = "/set";
      }
      
      const finalCommandTopic = `${device.topic}${commandTopicSuffix}`;
      mockMqttService.publish(finalCommandTopic, commandPayload)
        .catch(err => {
          console.error("Failed to publish MQTT command:", err);
        });
    // Fix: Use ConnectionStatus for connectionStatus check
    } else if (appConfig.controlMethod === 'mqtt' && connectionStatus !== 'connected') {
        console.warn("MQTT not connected. Command not sent for device:", deviceId);
    } else if (appConfig.controlMethod === 'home_assistant_api') {
        // TODO: Implement HA API call for device state change
        console.warn("Home Assistant API control not yet implemented for device state change.", deviceId, newPartialState);
    }
  }, [devices, connectionStatus, appConfig]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-background text-brand-text-primary transition-colors duration-300">
      <Navbar 
        onToggleConfig={() => setShowConfigPanel(true)} 
        // Fix: Pass ConnectionStatus to Navbar
        mqttStatus={connectionStatus}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      <div className="flex-grow">
        <Dashboard
          rooms={rooms}
          devices={devices}
          onDeviceStateChange={handleDeviceStateChange}
          // Fix: Pass ConnectionStatus to Dashboard
          mqttStatus={connectionStatus}
          isLoading={isLoadingDevices}
        />
      </div>
      <ConfigPanel
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
        onSave={handleSaveConfig}
        // Fix: Pass AppConfiguration as initialAppConfig
        initialAppConfig={appConfig}
        // Fix: Pass ConnectionStatus to ConfigPanel
        connectionStatus={connectionStatus}
        onConnect={connect}
        onDisconnect={disconnect}
      />
    </div>
  );
};

export default App;