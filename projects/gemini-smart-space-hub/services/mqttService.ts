

// Fix: Replaced MqttConfig with MqttConnectionConfig and MqttStatus with ConnectionStatus
import { MqttConnectionConfig, Device, DeviceState, ConnectionStatus, DeviceType, LightState, ThermostatState, SwitchState } from '../types';

// Fix: Replaced MqttStatus with ConnectionStatus
let onStatusChangeCallback: ((status: ConnectionStatus) => void) | null = null;
let onMessageCallback: ((topic: string, payload: string) => void) | null = null;
// Fix: Replaced MqttStatus with ConnectionStatus
let currentStatus: ConnectionStatus = 'disconnected';
let connectionTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Fix: Replaced MqttStatus with ConnectionStatus
const updateStatus = (newStatus: ConnectionStatus) => {
  currentStatus = newStatus;
  if (onStatusChangeCallback) {
    onStatusChangeCallback(currentStatus);
  }
};

const mockMqttService = {
  // Fix: Replaced MqttConfig with MqttConnectionConfig
  connect: async (config: MqttConnectionConfig): Promise<void> => {
    updateStatus('connecting');
    console.log('MQTT (Mock): Attempting to connect with', config);

    if (connectionTimeout) clearTimeout(connectionTimeout);
    
    return new Promise((resolve, reject) => {
      connectionTimeout = setTimeout(() => {
        if (config.brokerUrl && config.brokerUrl.includes('fail')) {
          updateStatus('error');
          console.error('MQTT (Mock): Connection failed (simulated by URL)');
          reject(new Error('Simulated connection failure: URL contains "fail"'));
        } else if (!config.brokerUrl) {
            updateStatus('error');
            console.error('MQTT (Mock): Connection failed (Broker URL is empty)');
            reject(new Error('Broker URL is required.'));
        }
        else {
          updateStatus('connected');
          reconnectAttempts = 0; // Reset on successful connection
          console.log('MQTT (Mock): Connected to', config.brokerUrl);
          if (onMessageCallback) {
            onMessageCallback("smart_home/status", JSON.stringify({ message: `Successfully connected to ${config.brokerUrl}` }));
          }
          resolve();
        }
      }, 1500 + Math.random() * 1000); 
    });
  },

  disconnect: async (): Promise<void> => {
    if (connectionTimeout) clearTimeout(connectionTimeout);
    console.log('MQTT (Mock): Disconnecting...');
    updateStatus('disconnected');
    reconnectAttempts = 0; 
  },

  subscribe: (topic: string): void => {
    if (currentStatus !== 'connected') {
        console.warn(`MQTT (Mock): Cannot subscribe. Not connected. Current status: ${currentStatus}`);
        return;
    }
    console.log(`MQTT (Mock): Subscribed to ${topic}`);
    if (topic.endsWith("/status") && onMessageCallback) {
        setTimeout(() => {
            onMessageCallback(topic, JSON.stringify({ data: `Subscription to ${topic} successful. Current value: ${Math.random().toFixed(2)}` }));
        }, 500);
    }
  },

  publish: async (topic: string, message: string): Promise<void> => {
     if (currentStatus !== 'connected') {
        console.warn(`MQTT (Mock): Cannot publish to ${topic}. Not connected. Current status: ${currentStatus}`);
        return Promise.reject(new Error("Not connected to MQTT broker"));
    }
    console.log(`MQTT (Mock): Publishing to ${topic}`, message);
    
    const isSetCommand = topic.includes('/set');
    const isHaSwitchCommand = topic.includes('/command'); // For HA ON/OFF switches

    if ((isSetCommand || isHaSwitchCommand) && onMessageCallback) {
      let stateTopic = topic;
      if (isSetCommand) {
        stateTopic = topic.replace('/set', '/state');
      } else if (isHaSwitchCommand) {
        stateTopic = topic.replace('/command', '/state');
      }
      
      setTimeout(() => {
        // If it's an HA switch command, the message is "ON" or "OFF" (not JSON)
        if (isHaSwitchCommand && (message === "ON" || message === "OFF")) {
            onMessageCallback(stateTopic, message); // Echo raw "ON"/"OFF"
            console.log(`MQTT (Mock): Simulated HA switch state update for ${stateTopic} with payload:`, message);
        } else { 
            // For /set commands, or other commands, try to parse as JSON
            try {
                const payloadObj = JSON.parse(message);
                onMessageCallback(stateTopic, JSON.stringify(payloadObj)); 
                console.log(`MQTT (Mock): Simulated state update for ${stateTopic} with JSON payload:`, payloadObj);
            } catch(e) {
                // If not JSON (e.g. a generic switch using ON/OFF on a /set topic, or other raw command)
                 onMessageCallback(stateTopic, message);
                 console.log(`MQTT (Mock): Simulated state update for ${stateTopic} with raw message (JSON parse failed or not applicable):`, message);
            }
        }
      }, 300 + Math.random() * 500);
    }
    return Promise.resolve();
  },

  onMessage: (callback: (topic: string, payload: string) => void): void => {
    onMessageCallback = callback;
  },

  // Fix: Replaced MqttStatus with ConnectionStatus
  onStatusChange: (callback: (status: ConnectionStatus) => void): void => {
    onStatusChangeCallback = callback;
    callback(currentStatus);
  },

  // Fix: Replaced MqttConfig with MqttConnectionConfig
  tryReconnect: (config: MqttConnectionConfig): void => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && currentStatus !== 'connecting' && currentStatus !== 'connected') {
      reconnectAttempts++;
      updateStatus('reconnecting');
      console.log(`MQTT (Mock): Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(() => {
        mockMqttService.connect(config).catch(() => {
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            updateStatus('error');
            console.error('MQTT (Mock): Max reconnect attempts reached.');
          }
        });
      }, 3000 * reconnectAttempts); 
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        updateStatus('error');
        console.error('MQTT (Mock): Max reconnect attempts reached. Please check your connection or configuration.');
    }
  }
};

export default mockMqttService;