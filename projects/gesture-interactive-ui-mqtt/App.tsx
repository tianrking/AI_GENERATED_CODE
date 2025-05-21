
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmark } from './types';

declare const window: any;
declare const mqtt: any; // Declare mqtt for global script

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Button dimensions and layout for Canvas
const BTN_WIDTH = 180; // Increased width for longer labels
const BTN_HEIGHT = 50;
const BTN_BORDER_RADIUS = 10;
const BTN_PADDING = 20;
const NUM_BUTTONS = 3;
const BUTTON_LABELS = ["Living Room Light", "Kitchen Fan", "Bedroom Lamp"]; // Updated labels

const TOTAL_BUTTONS_WIDTH = NUM_BUTTONS * BTN_WIDTH + (NUM_BUTTONS - 1) * BTN_PADDING;
const START_X = (VIDEO_WIDTH - TOTAL_BUTTONS_WIDTH) / 2;
const START_Y = VIDEO_HEIGHT / 2 - 120;

const CLICK_DISTANCE_THRESHOLD = 30;
const TRIGGER_EFFECT_DURATION_MS = 200;
const TRIGGER_SCALE_EFFECT = 1.1;
const LONG_PRESS_DURATION_MS = 2000;

// MQTT Configuration
const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'; // Updated to WSS and port 8884
const MQTT_TOPIC_PREFIX = 'gestureUI/switch';

interface ButtonState {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  isActivated: boolean; // Represents ON (true) / OFF (false) state
  isTriggered: boolean;
  triggerTimeoutId: number | null;
  justClicked: boolean;
  scaleEffect: number;
  longPressStartTime: number | null;
  longPressProgress: number;
  isLongPressCandidate: boolean;
}

const initialButtonStates: ButtonState[] = Array.from({ length: NUM_BUTTONS }, (_, i) => ({
  id: `btn-${i}`,
  label: BUTTON_LABELS[i] || `Switch ${i + 1}`,
  x: START_X + i * (BTN_WIDTH + BTN_PADDING),
  y: START_Y,
  width: BTN_WIDTH,
  height: BTN_HEIGHT,
  isHovered: false,
  isActivated: false, // Default to OFF
  isTriggered: false,
  triggerTimeoutId: null,
  justClicked: false,
  scaleEffect: 1.0,
  longPressStartTime: null,
  longPressProgress: 0,
  isLongPressCandidate: false,
}));

// Helper function to draw rounded rectangles with enhanced effects
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  button: ButtonState
) {
  const { x, y, width, height, label, isHovered, isActivated, isTriggered, scaleEffect, isLongPressCandidate, longPressProgress } = button;

  const currentScale = scaleEffect;
  const scaledWidth = width * currentScale;
  const scaledHeight = height * currentScale;
  const scaledX = x - (scaledWidth - width) / 2;
  const scaledY = y - (scaledHeight - height) / 2;

  let currentBgColor = 'rgba(56, 189, 248, 0.85)'; // Base Sky blue (OFF state)
  let currentTextColor = '#FFFFFF';
  let currentBorderColor = 'rgba(14, 116, 144, 0.9)';
  let currentBorderWidth = 2;

  if (isActivated && !isTriggered) { // ON State (not during trigger flash)
    currentBgColor = 'rgba(34, 197, 94, 0.9)'; // Green for ON
    currentBorderColor = 'rgba(22, 163, 74, 1)'; // Darker Green for ON
  }

  if (isTriggered) {
    currentBgColor = 'rgba(253, 224, 71, 0.95)'; // Vibrant Yellow for trigger
    currentTextColor = '#1E293B';
    currentBorderColor = 'rgba(245, 158, 11, 1)'; // Amber for trigger
    currentBorderWidth = 3;
  } else if (isHovered && !isActivated) { // Hover on OFF button
    currentBgColor = 'rgba(125, 211, 252, 0.9)'; // Lighter Sky Blue
    currentTextColor = '#1E293B';
    currentBorderColor = 'rgba(14, 165, 233, 1)'; // Brighter Sky Blue
  } else if (isHovered && isActivated) { // Hover on ON button
    currentBgColor = 'rgba(74, 222, 128, 0.9)'; // Lighter Green
    currentTextColor = '#1E293B';
    currentBorderColor = 'rgba(22, 163, 74, 1)';
  }


  ctx.beginPath();
  ctx.moveTo(scaledX + BTN_BORDER_RADIUS, scaledY);
  ctx.lineTo(scaledX + scaledWidth - BTN_BORDER_RADIUS, scaledY);
  ctx.quadraticCurveTo(scaledX + scaledWidth, scaledY, scaledX + scaledWidth, scaledY + BTN_BORDER_RADIUS);
  ctx.lineTo(scaledX + scaledWidth, scaledY + scaledHeight - BTN_BORDER_RADIUS);
  ctx.quadraticCurveTo(scaledX + scaledWidth, scaledY + scaledHeight, scaledX + scaledWidth - BTN_BORDER_RADIUS, scaledY + scaledHeight);
  ctx.lineTo(scaledX + BTN_BORDER_RADIUS, scaledY + scaledHeight);
  ctx.quadraticCurveTo(scaledX, scaledY + scaledHeight, scaledX, scaledY + scaledHeight - BTN_BORDER_RADIUS);
  ctx.lineTo(scaledX, scaledY + BTN_BORDER_RADIUS);
  ctx.quadraticCurveTo(scaledX, scaledY, scaledX + BTN_BORDER_RADIUS, scaledY);
  ctx.closePath();

  ctx.fillStyle = currentBgColor;
  ctx.fill();

  if (currentBorderWidth > 0) {
    ctx.strokeStyle = currentBorderColor;
    ctx.lineWidth = currentBorderWidth;
    ctx.stroke();
  }

  // Draw long press progress bar
  if (isLongPressCandidate && longPressProgress > 0 && !isTriggered) {
    const progressRectWidth = (scaledWidth - currentBorderWidth * 2) * longPressProgress;
    const progressRectHeight = scaledHeight - currentBorderWidth * 2;
    const progressRectX = scaledX + currentBorderWidth;
    const progressRectY = scaledY + currentBorderWidth;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // Semi-transparent white for progress

    ctx.beginPath();
    const innerRadius = Math.max(0, BTN_BORDER_RADIUS - currentBorderWidth);
    ctx.moveTo(progressRectX + innerRadius, progressRectY);
    ctx.lineTo(progressRectX + progressRectWidth - innerRadius, progressRectY);
    if (progressRectWidth >= innerRadius) {
         ctx.quadraticCurveTo(progressRectX + progressRectWidth, progressRectY, progressRectX + progressRectWidth, progressRectY + innerRadius);
    } else {
        ctx.lineTo(progressRectX + progressRectWidth, progressRectY);
    }
    ctx.lineTo(progressRectX + progressRectWidth, progressRectY + progressRectHeight - innerRadius);
    if (progressRectWidth >= innerRadius) {
        ctx.quadraticCurveTo(progressRectX + progressRectWidth, progressRectY + progressRectHeight, progressRectX + progressRectWidth - innerRadius, progressRectY + progressRectHeight);
    } else {
        ctx.lineTo(progressRectX + progressRectWidth, progressRectY + progressRectHeight);
    }
    ctx.lineTo(progressRectX + innerRadius, progressRectY + progressRectHeight);
    ctx.quadraticCurveTo(progressRectX, progressRectY + progressRectHeight, progressRectX, progressRectY + progressRectHeight - innerRadius);
    ctx.lineTo(progressRectX, progressRectY + innerRadius);
    ctx.quadraticCurveTo(progressRectX, progressRectY, progressRectX + innerRadius, progressRectY);
    ctx.closePath();
    ctx.fill();
  }


  ctx.fillStyle = currentTextColor;
  ctx.font = `bold ${currentScale > 1.02 ? '15px' : '14px'} Arial`; // Adjusted font size slightly
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let displayText = label;
  const stateText = isActivated ? ' (ON)' : ' (OFF)';
  if (isTriggered) { // During trigger flash, show only label
      displayText = label;
  } else {
      displayText = `${label}${stateText}`;
  }


  ctx.save();
  ctx.translate(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2);
  ctx.scale(-1, 1); // Counter-mirror text
  ctx.fillText(displayText, 0, 0);
  ctx.restore();
}


const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handsInstanceRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);
  const activeTriggerTimeoutsRef = useRef<Record<string, number | null>>({});
  const mqttClientRef = useRef<any>(null); // For MQTT client instance


  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing camera and gesture detection...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buttonStates, setButtonStates] = useState<ButtonState[]>(initialButtonStates);
  const [mqttStatusMessage, setMqttStatusMessage] = useState<string>('MQTT: Initializing...');

  const publishMqttMessage = useCallback((button: ButtonState, newActivatedState: boolean) => {
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      const topic = `${MQTT_TOPIC_PREFIX}/${button.id}/state`;
      const payload = JSON.stringify({
        id: button.id,
        name: button.label,
        state: newActivatedState ? "ON" : "OFF",
        timestamp: new Date().toISOString()
      });
      mqttClientRef.current.publish(topic, payload, (err?: Error) => {
        if (err) {
          console.error('MQTT Publish Error:', err);
          setMqttStatusMessage(`MQTT: Publish failed for ${button.label}`);
        } else {
          console.log(`MQTT Message published to ${topic}:`, payload);
          // Optional: Update status on successful publish, though might be too verbose
          // setMqttStatusMessage(`MQTT: Sent ${button.label} -> ${newActivatedState ? "ON" : "OFF"}`);
        }
      });
    } else {
      console.warn(`MQTT client not connected. Message for ${button.label} not sent.`);
      setMqttStatusMessage(`MQTT: Not connected. Cannot send update for ${button.label}.`);
    }
  }, []);


  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) return;

    canvasElement.width = VIDEO_WIDTH;
    canvasElement.height = VIDEO_HEIGHT;
    const canvasCtx = canvasElement.getContext('2d');
    if (!canvasCtx) return;

    // Initialize MQTT Client
    if (typeof mqtt !== 'undefined' && !mqttClientRef.current) {
      const clientId = `gesture_ui_client_${Math.random().toString(16).substring(2, 8)}`;
      setMqttStatusMessage('MQTT: Connecting...');
      try {
        if (typeof mqtt.connect !== 'function') {
          throw new Error('mqtt.connect is not a function. MQTT.js library may not be loaded correctly.');
        }
        // Connect without explicit protocolVersion to use library default (likely MQTT 3.1.1) for wider compatibility.
        const client = mqtt.connect(MQTT_BROKER_URL, { clientId }); // MQTT_BROKER_URL is now wss://
        mqttClientRef.current = client;

        client.on('connect', () => {
          console.log('MQTT Connected to broker');
          setMqttStatusMessage('MQTT: Connected');
        });
        client.on('reconnect', () => {
          console.log('MQTT Reconnecting...');
          setMqttStatusMessage('MQTT: Reconnecting...');
        });
        client.on('error', (err: Error) => {
          console.error('MQTT Connection Error:', err);
          setMqttStatusMessage(`MQTT: Error - ${err.message}`);
        });
        client.on('close', () => {
          console.log('MQTT Connection Closed');
          setMqttStatusMessage('MQTT: Disconnected');
        });
        client.on('offline', () => {
          console.log('MQTT Client Offline');
          setMqttStatusMessage('MQTT: Offline');
        });
      } catch (e: any) { // Catch as 'any' to better inspect 'e'
         console.error("Failed to initialize MQTT client:", e);
         let detailMessage = 'MQTT: Failed to initialize';
         if (e && e.message) {
            detailMessage += ` - ${e.message}`;
         } else if (typeof e === 'string') {
            detailMessage += ` - ${e}`;
         } else {
            detailMessage += ` - Unknown error. Check console.`;
         }
         setMqttStatusMessage(detailMessage);
      }
    }


    const handleMediaPipeResults = (results: any) => {
      setButtonStates(prevButtonStates => {
        let nextButtonStates = JSON.parse(JSON.stringify(prevButtonStates)) as ButtonState[];

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.save();
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1); // Mirror the canvas for selfie view

        let landmarkX = 0, landmarkY = 0;
        let indexFingerTipValid = false;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const indexFingerTip = landmarks[8] as HandLandmark;
          const indexFingerPip = landmarks[6] as HandLandmark;

          if (indexFingerTip && indexFingerPip) {
            indexFingerTipValid = true;
            landmarkX = indexFingerTip.x * canvasElement.width;
            landmarkY = indexFingerTip.y * canvasElement.height;
            const pipCanvasX = indexFingerPip.x * canvasElement.width;
            const pipCanvasY = indexFingerPip.y * canvasElement.height;
            const dx = landmarkX - pipCanvasX;
            const dy = landmarkY - pipCanvasY;
            const tipPipDistance = Math.sqrt(dx * dx + dy * dy);

            nextButtonStates.forEach((button, buttonIndex) => {
              const isOverButton =
                landmarkX >= button.x &&
                landmarkX <= button.x + button.width &&
                landmarkY >= button.y &&
                landmarkY <= button.y + button.height;

              if (isOverButton) {
                nextButtonStates[buttonIndex].isHovered = true;

                if (tipPipDistance < CLICK_DISTANCE_THRESHOLD && !button.justClicked) {
                  const newActivatedState = !button.isActivated;
                  nextButtonStates[buttonIndex].isActivated = newActivatedState;
                  nextButtonStates[buttonIndex].isTriggered = true;
                  nextButtonStates[buttonIndex].justClicked = true;
                  nextButtonStates[buttonIndex].scaleEffect = TRIGGER_SCALE_EFFECT;

                  nextButtonStates[buttonIndex].isLongPressCandidate = false;
                  nextButtonStates[buttonIndex].longPressStartTime = null;
                  nextButtonStates[buttonIndex].longPressProgress = 0;

                  publishMqttMessage(button, newActivatedState); // Publish MQTT message

                  if (activeTriggerTimeoutsRef.current[button.id]) {
                    clearTimeout(activeTriggerTimeoutsRef.current[button.id]!);
                  }

                  const timeoutId = window.setTimeout(() => {
                    setButtonStates(current => current.map(bs =>
                      bs.id === button.id ? { ...bs, isTriggered: false, triggerTimeoutId: null, scaleEffect: 1.0 } : bs
                    ));
                    activeTriggerTimeoutsRef.current[button.id] = null;
                  }, TRIGGER_EFFECT_DURATION_MS);
                  nextButtonStates[buttonIndex].triggerTimeoutId = timeoutId;
                  activeTriggerTimeoutsRef.current[button.id] = timeoutId;

                } else if (tipPipDistance >= CLICK_DISTANCE_THRESHOLD) {
                  if (button.justClicked) nextButtonStates[buttonIndex].justClicked = false;

                  if (!button.justClicked && !button.isTriggered) {
                    if (!button.isLongPressCandidate) {
                      nextButtonStates[buttonIndex].isLongPressCandidate = true;
                      nextButtonStates[buttonIndex].longPressStartTime = Date.now();
                      nextButtonStates[buttonIndex].longPressProgress = 0;
                    } else if (button.longPressStartTime) {
                      const elapsedTime = Date.now() - button.longPressStartTime;
                      nextButtonStates[buttonIndex].longPressProgress = Math.min(1, elapsedTime / LONG_PRESS_DURATION_MS);

                      if (elapsedTime >= LONG_PRESS_DURATION_MS) {
                        const newActivatedState = !button.isActivated;
                        nextButtonStates[buttonIndex].isActivated = newActivatedState;
                        nextButtonStates[buttonIndex].isTriggered = true;
                        nextButtonStates[buttonIndex].scaleEffect = TRIGGER_SCALE_EFFECT;

                        nextButtonStates[buttonIndex].isLongPressCandidate = false;
                        nextButtonStates[buttonIndex].longPressStartTime = null;
                        nextButtonStates[buttonIndex].longPressProgress = 0;

                        publishMqttMessage(button, newActivatedState); // Publish MQTT message

                        if (activeTriggerTimeoutsRef.current[button.id]) {
                            clearTimeout(activeTriggerTimeoutsRef.current[button.id]!);
                        }
                        const timeoutId = window.setTimeout(() => {
                            setButtonStates(current => current.map(bs =>
                            bs.id === button.id ? { ...bs, isTriggered: false, triggerTimeoutId: null, scaleEffect: 1.0 } : bs
                            ));
                            activeTriggerTimeoutsRef.current[button.id] = null;
                        }, TRIGGER_EFFECT_DURATION_MS);
                        nextButtonStates[buttonIndex].triggerTimeoutId = timeoutId;
                        activeTriggerTimeoutsRef.current[button.id] = timeoutId;
                      }
                    }
                  }
                }
              } else {
                nextButtonStates[buttonIndex].isHovered = false;
                if (button.justClicked) nextButtonStates[buttonIndex].justClicked = false;

                nextButtonStates[buttonIndex].isLongPressCandidate = false;
                nextButtonStates[buttonIndex].longPressStartTime = null;
                nextButtonStates[buttonIndex].longPressProgress = 0;

                if (!nextButtonStates[buttonIndex].isTriggered) {
                  nextButtonStates[buttonIndex].scaleEffect = 1.0;
                }
              }
            });
          } else {
            indexFingerTipValid = false;
            nextButtonStates = nextButtonStates.map(bs => ({
                ...bs,
                isHovered: false,
                justClicked: false,
                isLongPressCandidate: false,
                longPressStartTime: null,
                longPressProgress: 0,
                scaleEffect: bs.isTriggered ? bs.scaleEffect : 1.0,
            }));
          }

          window.drawConnectors(canvasCtx, landmarks, window.Hands.HAND_CONNECTIONS, { color: 'rgba(0, 255, 0, 0.7)', lineWidth: 3 });
          window.drawLandmarks(canvasCtx, landmarks, { color: 'rgba(255, 0, 0, 0.7)', lineWidth: 1, radius: 3 });

        } else {
          indexFingerTipValid = false;
          nextButtonStates = nextButtonStates.map(bs => ({
            ...bs,
            isHovered: false,
            justClicked: false,
            isLongPressCandidate: false,
            longPressStartTime: null,
            longPressProgress: 0,
            scaleEffect: bs.isTriggered ? bs.scaleEffect : 1.0,
          }));
        }

        nextButtonStates.forEach(button => drawRoundedRect(canvasCtx, button));

        if (indexFingerTipValid) {
            canvasCtx.beginPath();
            canvasCtx.arc(landmarkX, landmarkY, 10, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'rgba(0, 255, 255, 0.75)';
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            canvasCtx.lineWidth = 2;
            canvasCtx.fill();
            canvasCtx.stroke();
        }

        canvasCtx.restore();
        canvasCtx.restore();

        if (JSON.stringify(nextButtonStates) !== JSON.stringify(prevButtonStates)) {
          return nextButtonStates;
        }
        return prevButtonStates;
      });
    };

    function initializeMediaPipe() {
      try {
        handsInstanceRef.current = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        handsInstanceRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });
        handsInstanceRef.current.onResults(handleMediaPipeResults);

        cameraInstanceRef.current = new window.Camera(videoElement, {
          onFrame: async () => {
            if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA && videoElement.videoWidth > 0 && handsInstanceRef.current) {
              try {
                await handsInstanceRef.current.send({ image: videoElement });
              } catch (error) {
                console.error('Error sending frame to MediaPipe Hands:', error);
                // Potentially set an error message for the user if this persists
              }
            }
          },
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        });

        cameraInstanceRef.current.start()
          .then(() => setLoadingMessage(''))
          .catch((err: Error) => {
            console.error("Failed to start camera:", err);
            setErrorMessage(`Failed to start camera: ${err.message}. Please ensure camera access is allowed and no other app is using it.`);
            setLoadingMessage('');
          });
      } catch (err) {
        console.error("Error initializing MediaPipe:", err);
        setErrorMessage(`Failed to initialize MediaPipe: ${(err as Error).message}. Check console for details.`);
        setLoadingMessage('');
      }
    }

    if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
      setLoadingMessage('Loading MediaPipe libraries...');
      const checkInterval = setInterval(() => {
        if (typeof window.Hands !== 'undefined' && typeof window.Camera !== 'undefined') {
          clearInterval(checkInterval);
          setLoadingMessage('Initializing gesture detection...');
          initializeMediaPipe();
        }
      }, 500);
      return () => clearInterval(checkInterval);
    } else {
      initializeMediaPipe();
    }

    return () => {
      console.log("Cleaning up App component...");

      Object.values(activeTriggerTimeoutsRef.current).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      activeTriggerTimeoutsRef.current = {};

      if (handsInstanceRef.current) {
        const hands = handsInstanceRef.current;
        handsInstanceRef.current = null;
        if (typeof hands.close === 'function') {
          hands.close().catch((e: Error) => console.error("Error closing Hands:", e));
        } else {
          console.warn("Hands instance or its close method was not available for cleanup.");
        }
      }

      if (cameraInstanceRef.current) {
        const cam = cameraInstanceRef.current;
        cameraInstanceRef.current = null;
        if (typeof cam.close === 'function') {
          try {
            cam.close(); // Correct method for MediaPipe Camera utility
            console.log("Camera instance closed via cam.close().");
          } catch (e) {
            console.error("Error during camera.close():", e);
            // Fallback if cam.close() itself throws an error
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                if (stream && typeof stream.getTracks === 'function') {
                    stream.getTracks().forEach(track => track.stop());
                }
                videoRef.current.srcObject = null;
                console.log("Fallback: Manually stopped video tracks after camera.close() error.");
            }
          }
        } else {
          console.warn("Camera object 'cam' did not have a .close method. Attempting manual cleanup of its video element.");
          // Check if cam.video exists and has a stream to stop
          if (cam.video && cam.video.srcObject && typeof (cam.video.srcObject as MediaStream).getTracks === 'function') {
              (cam.video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
              if(cam.video.srcObject) cam.video.srcObject = null; // Nullify the srcObject on the specific video element managed by Camera
              console.log("Camera tracks stopped manually via cam.video.");
          } else if (videoRef.current && videoRef.current.srcObject) {
              // General fallback to videoRef if cam.video wasn't useful or cam wasn't a full Camera instance
              const stream = videoRef.current.srcObject as MediaStream;
              if (stream && typeof stream.getTracks === 'function') {
                  stream.getTracks().forEach(track => track.stop());
              }
              videoRef.current.srcObject = null;
              console.log("Camera tracks stopped manually via videoRef.current.");
          }
        }
      } else if (videoRef.current && videoRef.current.srcObject) {
        // Case where cameraInstanceRef.current might already be null (e.g., if init failed)
        // but the video element itself might still have an active stream.
        console.log("cameraInstanceRef.current was null in cleanup, cleaning up videoRef.current's stream directly.");
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
      }


      if (mqttClientRef.current) {
        const client = mqttClientRef.current;
        mqttClientRef.current = null;
        try {
            client.end(true, () => { // Force close, pass callback
            console.log('MQTT client ended on cleanup.');
            });
        } catch (e) {
            console.error("Error ending MQTT client:", e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishMqttMessage]); // publishMqttMessage is stable due to useCallback with empty deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4 bg-slate-900 text-slate-100 select-none">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-sky-400 mb-1">Virtual Smart Switches</h1>
        <p className="text-slate-300 text-lg">Control smart devices with gestures. Toggle ON/OFF.</p>
      </header>

      <div className="status-messages space-y-2 text-center">
        {loadingMessage && (
          <div role="status" aria-live="polite" className="p-3 bg-sky-500/30 text-sky-300 rounded-lg shadow-md inline-flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-sky-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{loadingMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="p-3 bg-red-600/80 text-red-100 rounded-lg shadow-md max-w-md"> {/* Adjusted max-width */}
            <p className="font-semibold">Oops! Something went wrong:</p>
            <p className="text-sm">{errorMessage}</p>
            <p className="mt-1 text-xs">Please check camera permissions, ensure no other app is using the camera, and try refreshing.</p>
          </div>
        )}
         <div
            role="status"
            aria-live="polite"
            className={`p-2 rounded-md text-sm ${
              mqttStatusMessage.startsWith('MQTT: Connected') ? 'bg-green-600/70 text-green-100' :
              mqttStatusMessage.includes('MQTT: Error') || mqttStatusMessage.includes('MQTT: Disconnected') || mqttStatusMessage.includes('MQTT: Offline') || mqttStatusMessage.includes('failed') || mqttStatusMessage.includes('Failed') ? 'bg-yellow-600/70 text-yellow-100' :
              'bg-slate-700/70 text-slate-300' // Adjusted condition for failure messages
            }`}
          >
          {mqttStatusMessage}
        </div>
      </div>

      <div className="video-container rounded-lg overflow-hidden shadow-2xl border-2 border-sky-600/50" style={{width: VIDEO_WIDTH, height: VIDEO_HEIGHT}}>
        <video ref={videoRef} style={{ display: 'block' }} playsInline autoPlay muted></video>
        <canvas ref={canvasRef}></canvas>
      </div>

      <footer className="mt-4 text-sm text-slate-400 text-center">
        <p>Point your index finger: "click" or hold for 2 seconds to toggle switches.</p>
        <p>Ensure good lighting and a clear view of your hand. Switch states are sent via MQTT.</p>
        <p>Powered by MediaPipe Hands, React & MQTT.js.</p>
      </footer>
    </div>
  );
};

export default App;
