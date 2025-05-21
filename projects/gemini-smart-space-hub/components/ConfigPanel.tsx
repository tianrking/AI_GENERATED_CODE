import React, { useState, useEffect } from 'react';
import { AppConfiguration, ControlMethod, ConnectionStatus } from '../types';
import { CloseIcon, WifiConnectionIcon, InfoIcon } from '../constants';
import { DEFAULT_MQTT_BROKER_PORT, DEFAULT_MQTT_WS_PORT, DEFAULT_HA_API_URL, DEFAULT_HA_TOKEN } from '../constants';
import Button from './ui/Button';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AppConfiguration) => Promise<void>;
  initialAppConfig: AppConfiguration;
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAppConfig,
  connectionStatus,
  onConnect,
  onDisconnect,
}) => {
  const [appConfig, setAppConfig] = useState<AppConfiguration>(initialAppConfig);
  const [useWebSocket, setUseWebSocket] = useState(initialAppConfig.mqtt.brokerUrl.startsWith('ws'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAppConfig(initialAppConfig);
    setUseWebSocket(initialAppConfig.mqtt.brokerUrl.startsWith('ws'));
  }, [initialAppConfig, isOpen]);

  const handleControlMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMethod = e.target.value as ControlMethod;
    setAppConfig(prev => ({ ...prev, controlMethod: newMethod }));
  };
  
  const handleMqttChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'useWebSocket') {
      const isChecked = (e.target as HTMLInputElement).checked;
      setUseWebSocket(isChecked);
      setAppConfig(prev => ({
        ...prev,
        mqtt: {
            ...prev.mqtt,
            brokerUrl: isChecked 
            ? (prev.mqtt.brokerUrl.startsWith('mqtt://') ? prev.mqtt.brokerUrl.replace('mqtt://', 'ws://') : (prev.mqtt.brokerUrl.startsWith('mqtts://') ? prev.mqtt.brokerUrl.replace('mqtts://', 'wss://') : `ws://${prev.mqtt.brokerUrl.replace(/^(wss?|mqtts?):\/\//, '')}`))
            : (prev.mqtt.brokerUrl.startsWith('ws://') ? prev.mqtt.brokerUrl.replace('ws://', 'mqtt://') : (prev.mqtt.brokerUrl.startsWith('wss://') ? prev.mqtt.brokerUrl.replace('wss://', 'mqtts://') : `mqtt://${prev.mqtt.brokerUrl.replace(/^(wss?|mqtts?):\/\//, '')}`)),
            port: isChecked ? DEFAULT_MQTT_WS_PORT : DEFAULT_MQTT_BROKER_PORT,
        }
      }));
    } else {
      setAppConfig(prev => ({
        ...prev,
        mqtt: {
            ...prev.mqtt,
            [name]: type === 'number' ? parseInt(value, 10) : value,
        }
      }));
    }
  };

  const handleMqttBrokerUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
     const prefix = useWebSocket 
        ? (appConfig.mqtt.brokerUrl.startsWith('wss://') || appConfig.mqtt.brokerUrl.startsWith('https://') ? 'wss://' : 'ws://') 
        : (appConfig.mqtt.brokerUrl.startsWith('mqtts://') ? 'mqtts://' : 'mqtt://');

    setAppConfig(prev => ({
        ...prev,
        mqtt: {
            ...prev.mqtt,
            brokerUrl: prefix + value,
        }
    }));
  };
  
  const handleHaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAppConfig(prev => ({
        ...prev,
        homeAssistant: {
            ...prev.homeAssistant,
            [name]: value,
        }
    }));
  };


  const handleSave = async () => {
    setError(null);
    if (appConfig.controlMethod === 'mqtt' && (!appConfig.mqtt.brokerUrl || !appConfig.mqtt.port)) {
      setError("MQTT Broker URL and Port are required.");
      return;
    }
    if (appConfig.controlMethod === 'home_assistant_api' && (!appConfig.homeAssistant.url || !appConfig.homeAssistant.token)) {
      setError("Home Assistant URL and Token are required.");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(appConfig);
      if(connectionStatus === 'disconnected' || connectionStatus === 'error') {
        onConnect(); // Attempt to connect with new settings
      }
    } catch (e: any) {
      setError(e.message || "Failed to save configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting';
  const isConnected = connectionStatus === 'connected';

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-brand-surface shadow-2xl p-6 transform transition-transform duration-300 ease-in-out flex flex-col text-brand-text-primary ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <WifiConnectionIcon className="w-7 h-7 mr-2 text-brand-primary" />
            Connection Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close configuration panel"
          >
            <CloseIcon className="w-6 h-6 text-brand-text-secondary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-5 flex-grow overflow-y-auto pr-2 pb-4">
          {/* Control Method Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Control Method</label>
            <div className="flex space-x-4">
              {(['mqtt', 'home_assistant_api'] as ControlMethod[]).map(method => (
                <label key={method} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="controlMethod"
                    value={method}
                    checked={appConfig.controlMethod === method}
                    onChange={handleControlMethodChange}
                    className="form-radio h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-400"
                    disabled={isConnecting || isConnected}
                  />
                  <span className="text-sm">{method === 'mqtt' ? 'MQTT' : 'Home Assistant API'}</span>
                </label>
              ))}
            </div>
          </div>

          {appConfig.controlMethod === 'mqtt' && (
            <>
              <h3 className="text-lg font-medium text-brand-text-primary border-b border-slate-300 dark:border-slate-600 pb-1 mb-3">MQTT Configuration</h3>
              <div>
                <label htmlFor="brokerUrl" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Broker URL (e.g., {useWebSocket ? 'your-broker.com/mqtt' : 'your-broker.com'})
                </label>
                <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">
                      {useWebSocket ? (appConfig.mqtt.brokerUrl.includes('wss://') ? 'wss://' : 'ws://') : (appConfig.mqtt.brokerUrl.includes('mqtts://') ? 'mqtts://' : 'mqtt://')}
                    </span>
                    <input
                    type="text"
                    name="brokerUrl" 
                    id="brokerUrl"
                    value={appConfig.mqtt.brokerUrl.replace(/^(wss?|mqtts?):\/\//, '')}
                    onChange={handleMqttBrokerUrlChange}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-r-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:ring-sky-500 dark:focus:border-sky-500"
                    placeholder="broker.example.com"
                    disabled={isConnecting || isConnected}
                    />
                </div>
              </div>

              <div>
                <label htmlFor="port" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Port
                </label>
                <input
                  type="number"
                  name="port"
                  id="port"
                  value={appConfig.mqtt.port}
                  onChange={handleMqttChange}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:ring-sky-500 dark:focus:border-sky-500"
                  placeholder={useWebSocket ? String(DEFAULT_MQTT_WS_PORT) : String(DEFAULT_MQTT_BROKER_PORT)}
                  disabled={isConnecting || isConnected}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="useWebSocket"
                  name="useWebSocket" // Important: Name must match for handler
                  type="checkbox"
                  checked={useWebSocket}
                  onChange={handleMqttChange}
                  disabled={isConnecting || isConnected}
                  className="h-4 w-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary dark:focus:ring-sky-500 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                />
                <label htmlFor="useWebSocket" className="ml-2 block text-sm text-brand-text-secondary">
                  Use WebSocket (for browser clients)
                </label>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Username (Optional)
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={appConfig.mqtt.username || ''}
                  onChange={handleMqttChange}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:ring-sky-500 dark:focus:border-sky-500"
                  disabled={isConnecting || isConnected}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={appConfig.mqtt.password || ''}
                  onChange={handleMqttChange}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:ring-sky-500 dark:focus:border-sky-500"
                  disabled={isConnecting || isConnected}
                />
              </div>
               <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-sm text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300">
                  <InfoIcon className="w-5 h-5 inline mr-1 -mt-1" />
                  Using mock MQTT service. Changes here are for UI demonstration. Actual connection behavior is simulated.
               </div>
            </>
          )}

          {appConfig.controlMethod === 'home_assistant_api' && (
            <>
              <h3 className="text-lg font-medium text-brand-text-primary border-b border-slate-300 dark:border-slate-600 pb-1 mb-3">Home Assistant API Configuration</h3>
              <div>
                <label htmlFor="haUrl" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Home Assistant URL (e.g., http://localhost:8123)
                </label>
                <input
                  type="text"
                  name="url"
                  id="haUrl"
                  value={appConfig.homeAssistant.url}
                  onChange={handleHaChange}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:ring-sky-500 dark:focus:border-sky-500"
                  placeholder={DEFAULT_HA_API_URL}
                  disabled={isConnecting || isConnected}
                />
              </div>
              <div>
                <label htmlFor="haToken" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Long-Lived Access Token
                </label>
                <input
                  type="password"
                  name="token"
                  id="haToken"
                  value={appConfig.homeAssistant.token}
                  onChange={handleHaChange}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:focus:ring-sky-500 dark:focus:border-sky-500"
                  placeholder="Enter your HA token"
                  disabled={isConnecting || isConnected}
                />
              </div>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-sm text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300">
                <InfoIcon className="w-5 h-5 inline mr-1 -mt-1" />
                 Ensure your Home Assistant instance allows CORS from this web app's origin if you encounter connection issues. This usually involves adding to `http.cors_allowed_origins` in your HA `configuration.yaml`.
              </div>
            </>
          )}
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col space-y-3">
          <Button 
            onClick={handleSave} 
            isLoading={isLoading}
            disabled={isConnecting || isConnected}
            className="w-full"
          >
            Save Configuration
          </Button>
          {isConnected ? (
            <Button 
              variant="danger"
              onClick={onDisconnect} 
              isLoading={isConnecting} // Should be false if already connected, maybe a different state for 'disconnecting'
              className="w-full"
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              variant="primary"
              onClick={onConnect} 
              isLoading={isConnecting}
              disabled={isConnecting || 
                (appConfig.controlMethod === 'mqtt' && (!appConfig.mqtt.brokerUrl || !appConfig.mqtt.port)) ||
                (appConfig.controlMethod === 'home_assistant_api' && (!appConfig.homeAssistant.url || !appConfig.homeAssistant.token))
              }
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;