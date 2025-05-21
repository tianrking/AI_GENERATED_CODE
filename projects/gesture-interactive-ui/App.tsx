
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmark } from './types';

declare const window: any;

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Button dimensions and layout for Canvas
const BTN_WIDTH = 140;
const BTN_HEIGHT = 50;
const BTN_BORDER_RADIUS = 10;
const BTN_PADDING = 20;
const NUM_BUTTONS = 3;
const BUTTON_LABELS = ["Option Alpha", "Beta Choice", "Gamma Action"];

const TOTAL_BUTTONS_WIDTH = NUM_BUTTONS * BTN_WIDTH + (NUM_BUTTONS - 1) * BTN_PADDING;
const START_X = (VIDEO_WIDTH - TOTAL_BUTTONS_WIDTH) / 2;
const START_Y = VIDEO_HEIGHT / 2 - 120;

const CLICK_DISTANCE_THRESHOLD = 30;
const TRIGGER_EFFECT_DURATION_MS = 200;
const TRIGGER_SCALE_EFFECT = 1.1;
const LONG_PRESS_DURATION_MS = 2000; // Changed from 5000 to 2000

interface ButtonState {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  isActivated: boolean;
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
  label: BUTTON_LABELS[i] || `Button ${i + 1}`,
  x: START_X + i * (BTN_WIDTH + BTN_PADDING),
  y: START_Y,
  width: BTN_WIDTH,
  height: BTN_HEIGHT,
  isHovered: false,
  isActivated: false,
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

  let currentBgColor = 'rgba(56, 189, 248, 0.85)'; // Base Sky blue
  let currentTextColor = '#FFFFFF';
  let currentBorderColor = 'rgba(14, 116, 144, 0.9)';
  let currentBorderWidth = 2;

  if (isTriggered) {
    currentBgColor = 'rgba(253, 224, 71, 0.95)'; // Vibrant Yellow
    currentTextColor = '#1E293B';
    currentBorderColor = 'rgba(245, 158, 11, 1)'; // Amber
    currentBorderWidth = 3;
  } else if (isActivated) {
    currentBgColor = 'rgba(34, 197, 94, 0.9)'; // Green
    currentTextColor = '#FFFFFF';
    currentBorderColor = 'rgba(22, 163, 74, 1)'; // Darker Green
  } else if (isHovered) {
    currentBgColor = 'rgba(125, 211, 252, 0.9)'; // Lighter Sky Blue
    currentTextColor = '#1E293B';
    currentBorderColor = 'rgba(14, 165, 233, 1)'; // Brighter Sky Blue
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
    
    // Create a rounded rectangle path for the progress bar (simplified: using inner dimensions)
    ctx.beginPath();
    const innerRadius = Math.max(0, BTN_BORDER_RADIUS - currentBorderWidth);
    ctx.moveTo(progressRectX + innerRadius, progressRectY);
    ctx.lineTo(progressRectX + progressRectWidth - innerRadius, progressRectY); // Only fill up to progressWidth
    // Top-right corner (adjust if progressRectWidth is too small for full radius)
    if (progressRectWidth >= innerRadius) {
         ctx.quadraticCurveTo(progressRectX + progressRectWidth, progressRectY, progressRectX + progressRectWidth, progressRectY + innerRadius);
    } else {
        ctx.lineTo(progressRectX + progressRectWidth, progressRectY); // Straight line if no space for curve
    }
    ctx.lineTo(progressRectX + progressRectWidth, progressRectY + progressRectHeight - innerRadius);
    // Bottom-right corner
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
  ctx.font = `bold ${currentScale > 1.02 ? '17px' : '16px'} Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let displayText = label;
  if (isActivated && !isTriggered) { // Don't show checkmark during the brief trigger flash
    displayText = `✓ ${label}`;
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


  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing camera and gesture detection...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buttonStates, setButtonStates] = useState<ButtonState[]>(initialButtonStates);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) return;

    canvasElement.width = VIDEO_WIDTH;
    canvasElement.height = VIDEO_HEIGHT;
    const canvasCtx = canvasElement.getContext('2d');
    if (!canvasCtx) return;

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
            landmarkX = indexFingerTip.x * canvasElement.width; // No longer (1 - indexFingerTip.x) due to canvas transform
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

                // Click detection takes precedence
                if (tipPipDistance < CLICK_DISTANCE_THRESHOLD && !button.justClicked) {
                  nextButtonStates[buttonIndex].isActivated = !button.isActivated;
                  nextButtonStates[buttonIndex].isTriggered = true;
                  nextButtonStates[buttonIndex].justClicked = true; // Prevent immediate re-click
                  nextButtonStates[buttonIndex].scaleEffect = TRIGGER_SCALE_EFFECT;
                  
                  // Reset long press if click occurs
                  nextButtonStates[buttonIndex].isLongPressCandidate = false;
                  nextButtonStates[buttonIndex].longPressStartTime = null;
                  nextButtonStates[buttonIndex].longPressProgress = 0;

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
                  if (button.justClicked) nextButtonStates[buttonIndex].justClicked = false; // Allow next click

                  // Long press logic (only if not just clicked and not already triggered)
                  if (!button.justClicked && !button.isTriggered) {
                    if (!button.isLongPressCandidate) {
                      nextButtonStates[buttonIndex].isLongPressCandidate = true;
                      nextButtonStates[buttonIndex].longPressStartTime = Date.now();
                      nextButtonStates[buttonIndex].longPressProgress = 0;
                    } else if (button.longPressStartTime) {
                      const elapsedTime = Date.now() - button.longPressStartTime;
                      nextButtonStates[buttonIndex].longPressProgress = Math.min(1, elapsedTime / LONG_PRESS_DURATION_MS);

                      if (elapsedTime >= LONG_PRESS_DURATION_MS) {
                        nextButtonStates[buttonIndex].isActivated = !button.isActivated;
                        nextButtonStates[buttonIndex].isTriggered = true; // Show trigger effect
                        nextButtonStates[buttonIndex].scaleEffect = TRIGGER_SCALE_EFFECT;
                        
                        // Reset long press
                        nextButtonStates[buttonIndex].isLongPressCandidate = false;
                        nextButtonStates[buttonIndex].longPressStartTime = null;
                        nextButtonStates[buttonIndex].longPressProgress = 0;
                        
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
              } else { // Not over button
                nextButtonStates[buttonIndex].isHovered = false;
                if (button.justClicked) nextButtonStates[buttonIndex].justClicked = false;
                
                // Reset long press if finger moves off
                nextButtonStates[buttonIndex].isLongPressCandidate = false;
                nextButtonStates[buttonIndex].longPressStartTime = null;
                nextButtonStates[buttonIndex].longPressProgress = 0;

                if (!nextButtonStates[buttonIndex].isTriggered) { // Don't reset scale if mid-trigger
                  nextButtonStates[buttonIndex].scaleEffect = 1.0;
                }
              }
            });
          } else { 
            indexFingerTipValid = false; 
            // If no hand/finger, reset hover and long press for all buttons
            nextButtonStates = nextButtonStates.map(bs => ({
                ...bs,
                isHovered: false,
                justClicked: false, // Ensure this is reset too
                isLongPressCandidate: false,
                longPressStartTime: null,
                longPressProgress: 0,
                scaleEffect: bs.isTriggered ? bs.scaleEffect : 1.0,
            }));
          }
          
          window.drawConnectors(canvasCtx, landmarks, window.Hands.HAND_CONNECTIONS, { color: 'rgba(0, 255, 0, 0.7)', lineWidth: 3 });
          window.drawLandmarks(canvasCtx, landmarks, { color: 'rgba(255, 0, 0, 0.7)', lineWidth: 1, radius: 3 });

        } else { // No hands detected
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
            // Draw fingertip cursor (mirrored canvas means X is direct)
            canvasCtx.beginPath();
            canvasCtx.arc(landmarkX, landmarkY, 10, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'rgba(0, 255, 255, 0.75)';
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            canvasCtx.lineWidth = 2;
            canvasCtx.fill();
            canvasCtx.stroke();
        }

        canvasCtx.restore(); // Mirror restore
        canvasCtx.restore(); // Overall restore

        if (JSON.stringify(nextButtonStates) !== JSON.stringify(prevButtonStates)) {
          return nextButtonStates;
        }
        return prevButtonStates; // No change
      });
    };

    function initializeMediaPipe() {
      handsInstanceRef.current = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      handsInstanceRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7, // Increased slightly
        minTrackingConfidence: 0.7, // Increased slightly
      });
      handsInstanceRef.current.onResults(handleMediaPipeResults);

      cameraInstanceRef.current = new window.Camera(videoElement, {
        onFrame: async () => {
          if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA && videoElement.videoWidth > 0 && handsInstanceRef.current) {
            try {
              await handsInstanceRef.current.send({ image: videoElement });
            } catch (error) {
              console.error('Error sending frame to MediaPipe Hands:', error);
              // Potentially set an error state here for the user
            }
          }
        },
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
      });

      cameraInstanceRef.current.start()
        .then(() => setLoadingMessage('')) // Clear loading message on success
        .catch((err: Error) => {
          console.error("Failed to start camera:", err);
          setErrorMessage(`Failed to start camera: ${err.message}. Please ensure camera access is allowed and no other app is using it.`);
          setLoadingMessage('');
        });
    }

    // Check if MediaPipe libraries are loaded, then initialize
    if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
      setLoadingMessage('Loading MediaPipe libraries...');
      const checkInterval = setInterval(() => {
        if (typeof window.Hands !== 'undefined' && typeof window.Camera !== 'undefined') {
          clearInterval(checkInterval);
          setLoadingMessage('Initializing gesture detection...');
          initializeMediaPipe();
        }
      }, 500);
      return () => clearInterval(checkInterval); // Cleanup interval
    } else {
      initializeMediaPipe();
    }
    
    return () => { // Cleanup function for useEffect
      console.log("Cleaning up App component...");
      if (cameraInstanceRef.current) {
        const cam = cameraInstanceRef.current;
        cameraInstanceRef.current = null; 
        // Ensure graceful camera stop
        if (cam.video && cam.video.srcObject){
            (cam.video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            cam.video.srcObject = null; // Release the stream
        }
         // Attempt to call stop if available and not already stopped
        if (typeof cam.stop === 'function') {
          cam.stop().catch((e:Error) => console.error("Error stopping camera explicitly:", e));
        }
      }
      if (handsInstanceRef.current) {
        handsInstanceRef.current.close().catch((e:Error) => console.error("Error closing Hands:", e));
        handsInstanceRef.current = null;
      }
      // Clear any outstanding trigger timeouts
      Object.values(activeTriggerTimeoutsRef.current).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      activeTriggerTimeoutsRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only on mount and unmount

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6 bg-slate-900 text-slate-100 select-none">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-sky-400 mb-2">Virtual Finger Touch UI</h1>
        <p className="text-slate-300 text-lg">"Click" or hold your index finger (2s) on the floating buttons!</p>
      </header>

      {loadingMessage && (
        <div role="status" aria-live="polite" className="p-4 bg-sky-500/30 text-sky-300 rounded-lg shadow-md">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-sky-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{loadingMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-4 bg-red-600/80 text-red-100 rounded-lg shadow-md max-w-lg text-center">
          <p className="font-semibold text-lg">Oops! Something went wrong:</p>
          <p>{errorMessage}</p>
          <p className="mt-2 text-sm">Please check your camera permissions and try refreshing the page.</p>
        </div>
      )}

      <div className="video-container rounded-lg overflow-hidden shadow-2xl border-2 border-sky-600/50" style={{width: VIDEO_WIDTH, height: VIDEO_HEIGHT}}>
        <video ref={videoRef} style={{ display: 'block' }} playsInline autoPlay muted></video>
        <canvas ref={canvasRef}></canvas>
      </div>
      
      <footer className="mt-8 text-sm text-slate-400 text-center">
        <p>Point your index finger: "click" or hold for 2 seconds to toggle buttons.</p>
        <p>Ensure good lighting and a clear view of your hand.</p>
        <p>Powered by MediaPipe Hands & React.</p>
      </footer>
    </div>
  );
};

export default App;
