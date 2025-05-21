
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmark, DraggableObjectState, MediaPipeHandsInstance, MediaPipeCameraInstance, AppMode } from './types';
import {
  VIDEO_WIDTH, VIDEO_HEIGHT,
  DRAGGABLE_OBJECT_WIDTH, DRAGGABLE_OBJECT_HEIGHT,
  DRAGGABLE_OBJECT_COLOR, DRAGGABLE_OBJECT_DRAGGING_COLOR, DRAGGABLE_OBJECT_HOVER_COLOR, DRAGGABLE_OBJECT_BORDER_COLOR,
  THUMB_TIP_LANDMARK_INDEX, INDEX_FINGER_TIP_LANDMARK_INDEX,
  GRAB_DISTANCE_THRESHOLD, FINGER_CURSOR_RADIUS, GRAB_LINE_COLOR,
  CREATION_PALM_CENTER_LANDMARK_INDEX, CREATION_FINGER_TIP_LANDMARK_INDICES,
  MIN_FINGER_EXTENSION_FOR_CREATION_THRESHOLD, CREATION_HOLD_DURATION_MS,
  CREATION_PROGRESS_RADIUS, CREATION_PROGRESS_COLOR, CREATION_PROGRESS_BG_COLOR,
  POLYGON_COLOR, POLYGON_DRAGGING_COLOR, POLYGON_HOVER_COLOR,
  POLYGON_IN_PROGRESS_VERTEX_COLOR, POLYGON_IN_PROGRESS_LINE_COLOR, POLYGON_IN_PROGRESS_CURSOR_LINE_COLOR,
  POLYGON_MIN_VERTICES, POLYGON_VERTEX_RADIUS,
  POINTING_HOLD_DURATION_MS, POINTING_PROGRESS_RADIUS,
  INDEX_FINGER_MCP_LANDMARK_INDEX, MIDDLE_FINGER_TIP_LANDMARK_INDEX, MIDDLE_FINGER_MCP_LANDMARK_INDEX,
  RING_FINGER_TIP_LANDMARK_INDEX, RING_FINGER_MCP_LANDMARK_INDEX,
  PINKY_TIP_LANDMARK_INDEX, PINKY_MCP_LANDMARK_INDEX,
  POINTING_INDEX_EXTENSION_MIN_DIST, POINTING_OTHER_FINGER_CURLED_MAX_DIST
} from './constants';

// Helper function to draw the draggable object
function drawDraggableObject(ctx: CanvasRenderingContext2D, object: DraggableObjectState) {
  ctx.beginPath();
  let fillStyle = object.color;
  if (object.shape === 'polygon' && object.vertices && object.vertices.length > 0) {
    fillStyle = POLYGON_COLOR; // Default polygon color
    if (object.isDragging) {
      fillStyle = POLYGON_DRAGGING_COLOR;
    } else if (object.isHoveredByGrab) {
      fillStyle = POLYGON_HOVER_COLOR;
    }
    ctx.moveTo(object.vertices[0].x, object.vertices[0].y);
    for (let i = 1; i < object.vertices.length; i++) {
      ctx.lineTo(object.vertices[i].x, object.vertices[i].y);
    }
    ctx.closePath();
  } else { // Square
    fillStyle = object.color;
     if (object.isDragging) {
      fillStyle = object.draggingColor;
    } else if (object.isHoveredByGrab) {
      fillStyle = DRAGGABLE_OBJECT_HOVER_COLOR;
    }
    ctx.rect(object.x, object.y, object.width, object.height);
  }
  
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = object.borderColor;
  ctx.lineWidth = (object.isDragging || object.isHoveredByGrab) ? 4 : 2;
  ctx.stroke();
}

// Helper function to calculate distance between two points
function getDistance(p1: {x: number, y: number}, p2: {x: number, y: number}): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Point in polygon test
function isPointInPolygon(point: {x: number, y: number}, polygonVertices: {x: number, y: number}[]): boolean {
    if (!polygonVertices || polygonVertices.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygonVertices.length - 1; i < polygonVertices.length; j = i++) {
        const xi = polygonVertices[i].x, yi = polygonVertices[i].y;
        const xj = polygonVertices[j].x, yj = polygonVertices[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}


const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsInstanceRef = useRef<MediaPipeHandsInstance | null>(null);
  const cameraInstanceRef = useRef<MediaPipeCameraInstance | null>(null);
  
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing resources...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [appMode, setAppMode] = useState<AppMode>('idle');
  const appModeRef = useRef<AppMode>(appMode);

  const [draggableObjects, setDraggableObjects] = useState<DraggableObjectState[]>([]);
  const draggableObjectsRef = useRef<DraggableObjectState[]>(draggableObjects);

  const [creationProgress, setCreationProgress] = useState<number>(0); 
  const creationProgressRef = useRef<number>(creationProgress);

  const [pointingProgress, setPointingProgress] = useState<number>(0);
  const pointingProgressRef = useRef<number>(pointingProgress);

  const [currentPolygonVertices, setCurrentPolygonVertices] = useState<{x: number, y: number}[]>([]);
  const currentPolygonVerticesRef = useRef<{x: number, y: number}[]>(currentPolygonVertices);

  const isProcessingRef = useRef(false);
  const currentlyDraggedObjectIdRef = useRef<string | null>(null);
  
  const creationPoseStartTimeRef = useRef<number | null>(null);
  const creationPoseLocationRef = useRef<{ x: number, y: number } | null>(null);

  const pointingPoseStartTimeRef = useRef<number | null>(null);
  const pointingPoseLocationRef = useRef<{ x: number, y: number } | null>(null);

  const isCleaningUpRef = useRef(false); 
  
  useEffect(() => { draggableObjectsRef.current = draggableObjects; }, [draggableObjects]);
  useEffect(() => { creationProgressRef.current = creationProgress; }, [creationProgress]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);
  useEffect(() => { currentPolygonVerticesRef.current = currentPolygonVertices; }, [currentPolygonVertices]);
  useEffect(() => { pointingProgressRef.current = pointingProgress; }, [pointingProgress]);


  const handleMediaPipeResults = useCallback((results: any) => {
    if (isCleaningUpRef.current) return; 

    if (isProcessingRef.current) {
        return;
    }
    isProcessingRef.current = true;

    try {
      const canvasElement = canvasRef.current;
      if (!canvasElement) { isProcessingRef.current = false; return; } 
      const canvasCtx = canvasElement.getContext('2d');
      if (!canvasCtx) { isProcessingRef.current = false; return; } 

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      // Mirror the canvas to match the mirrored video feed
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1); 

      let thumbTip: { x: number, y: number } | null = null;
      let indexTip: { x: number, y: number } | null = null;
      let palmCenterForCreation: { x: number, y: number } | null = null;
      let indexFingerForPointing: { x: number, y: number} | null = null;
      let currentGrabActive = false;
      let grabMidpoint: { x: number, y: number } | null = null;
      let isPointingPose = false; 
      let isSquareCreationPose = false;

      let currentFrameDraggableObjects = [...draggableObjectsRef.current]; 

      const primaryHandLandmarks = (
        results.multiHandLandmarks &&
        Array.isArray(results.multiHandLandmarks) &&
        results.multiHandLandmarks.length > 0 &&
        Array.isArray(results.multiHandLandmarks[0]) &&
        results.multiHandLandmarks[0].length > 0
      ) ? results.multiHandLandmarks[0] as HandLandmark[] : null;

      if (primaryHandLandmarks) {
        const safeDrawingLandmarks = primaryHandLandmarks.filter(
            (lm): lm is HandLandmark => 
                lm && 
                typeof lm.x === 'number' && 
                typeof lm.y === 'number' &&
                typeof lm.z === 'number'
        );

        if (safeDrawingLandmarks.length > 5) {
            if (typeof window.drawConnectors === 'function') {
                window.drawConnectors(canvasCtx, safeDrawingLandmarks, window.Hands.HAND_CONNECTIONS, { color: 'rgba(0, 255, 0, 0.7)', lineWidth: 2 });
            }
            if (typeof window.drawLandmarks === 'function') {
                window.drawLandmarks(canvasCtx, safeDrawingLandmarks, { color: 'rgba(255, 0, 0, 0.7)', lineWidth: 1, radius: 2 });
            }
        }
        
        const thumbTipLmCandidate = primaryHandLandmarks[THUMB_TIP_LANDMARK_INDEX];
        if (thumbTipLmCandidate && typeof thumbTipLmCandidate.x === 'number' && typeof thumbTipLmCandidate.y === 'number') {
            thumbTip = { x: thumbTipLmCandidate.x * canvasElement.width, y: thumbTipLmCandidate.y * canvasElement.height };
        }

        const indexTipLmCandidate = primaryHandLandmarks[INDEX_FINGER_TIP_LANDMARK_INDEX];
        if (indexTipLmCandidate && typeof indexTipLmCandidate.x === 'number' && typeof indexTipLmCandidate.y === 'number') {
            indexTip = { x: indexTipLmCandidate.x * canvasElement.width, y: indexTipLmCandidate.y * canvasElement.height };
            indexFingerForPointing = indexTip;
        }
        
        const palmCenterLmCandidate = primaryHandLandmarks[CREATION_PALM_CENTER_LANDMARK_INDEX];
        if (palmCenterLmCandidate && typeof palmCenterLmCandidate.x === 'number' && typeof palmCenterLmCandidate.y === 'number') {
            palmCenterForCreation = { x: palmCenterLmCandidate.x * canvasElement.width, y: palmCenterLmCandidate.y * canvasElement.height };
        }
                
        if (thumbTip && indexTip) {
            const distance = getDistance(thumbTip, indexTip);
            if (distance < GRAB_DISTANCE_THRESHOLD) {
                currentGrabActive = true;
                grabMidpoint = { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 };
            }
        }

        if (appModeRef.current === 'idle' && palmCenterForCreation && !currentGrabActive) {
            let allFingersExtended = true;
            for (const fingerKey in CREATION_FINGER_TIP_LANDMARK_INDICES) {
                const lmIndex = CREATION_FINGER_TIP_LANDMARK_INDICES[fingerKey as keyof typeof CREATION_FINGER_TIP_LANDMARK_INDICES];
                const fingerTipLandmark = primaryHandLandmarks[lmIndex];
                if (!fingerTipLandmark || typeof fingerTipLandmark.x !== 'number' || typeof fingerTipLandmark.y !== 'number' ||
                    getDistance({x: fingerTipLandmark.x * canvasElement.width, y: fingerTipLandmark.y * canvasElement.height}, palmCenterForCreation) < MIN_FINGER_EXTENSION_FOR_CREATION_THRESHOLD) {
                    allFingersExtended = false;
                    break;
                }
            }
            isSquareCreationPose = allFingersExtended;
        }

        if (appModeRef.current === 'drawingPolygon' && !currentGrabActive) {
            const requiredLandmarksIndices = [
                INDEX_FINGER_TIP_LANDMARK_INDEX, INDEX_FINGER_MCP_LANDMARK_INDEX,
                MIDDLE_FINGER_TIP_LANDMARK_INDEX, MIDDLE_FINGER_MCP_LANDMARK_INDEX,
                RING_FINGER_TIP_LANDMARK_INDEX, RING_FINGER_MCP_LANDMARK_INDEX,
                PINKY_TIP_LANDMARK_INDEX, PINKY_MCP_LANDMARK_INDEX
            ];
            let allRequiredLandmarksPresent = true;
            for (const idx of requiredLandmarksIndices) {
                const lm = primaryHandLandmarks[idx];
                if (!lm || typeof lm.x !== 'number' || typeof lm.y !== 'number') {
                    allRequiredLandmarksPresent = false;
                    break;
                }
            }

            if (allRequiredLandmarksPresent) {
                const idxTip = { x: primaryHandLandmarks[INDEX_FINGER_TIP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[INDEX_FINGER_TIP_LANDMARK_INDEX].y * canvasElement.height };
                const idxMcp = { x: primaryHandLandmarks[INDEX_FINGER_MCP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[INDEX_FINGER_MCP_LANDMARK_INDEX].y * canvasElement.height };
                const midTip = { x: primaryHandLandmarks[MIDDLE_FINGER_TIP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[MIDDLE_FINGER_TIP_LANDMARK_INDEX].y * canvasElement.height };
                const midMcp = { x: primaryHandLandmarks[MIDDLE_FINGER_MCP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[MIDDLE_FINGER_MCP_LANDMARK_INDEX].y * canvasElement.height };
                const rngTip = { x: primaryHandLandmarks[RING_FINGER_TIP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[RING_FINGER_TIP_LANDMARK_INDEX].y * canvasElement.height };
                const rngMcp = { x: primaryHandLandmarks[RING_FINGER_MCP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[RING_FINGER_MCP_LANDMARK_INDEX].y * canvasElement.height };
                const pkyTip = { x: primaryHandLandmarks[PINKY_TIP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[PINKY_TIP_LANDMARK_INDEX].y * canvasElement.height };
                const pkyMcp = { x: primaryHandLandmarks[PINKY_MCP_LANDMARK_INDEX].x * canvasElement.width, y: primaryHandLandmarks[PINKY_MCP_LANDMARK_INDEX].y * canvasElement.height };

                const indexExtended = getDistance(idxTip, idxMcp) > POINTING_INDEX_EXTENSION_MIN_DIST;
                const middleCurled = getDistance(midTip, midMcp) < POINTING_OTHER_FINGER_CURLED_MAX_DIST;
                const ringCurled = getDistance(rngTip, rngMcp) < POINTING_OTHER_FINGER_CURLED_MAX_DIST;
                const pinkyCurled = getDistance(pkyTip, pkyMcp) < POINTING_OTHER_FINGER_CURLED_MAX_DIST;

                if (indexExtended && middleCurled && ringCurled && pinkyCurled) {
                    isPointingPose = true;
                }
            }
        }

        if (appModeRef.current === 'idle' && isSquareCreationPose && palmCenterForCreation) {
            if (creationPoseStartTimeRef.current === null) {
                creationPoseStartTimeRef.current = Date.now();
                creationPoseLocationRef.current = palmCenterForCreation;
            }
            const elapsedTime = Date.now() - creationPoseStartTimeRef.current;
            const newProgress = Math.min(1, elapsedTime / CREATION_HOLD_DURATION_MS);
            if (newProgress !== creationProgressRef.current) setCreationProgress(newProgress);
            
            if (newProgress >= 1) {
                const newObj: DraggableObjectState = {
                    id: `obj-sq-${Date.now()}`, shape: 'square',
                    x: creationPoseLocationRef.current!.x - DRAGGABLE_OBJECT_WIDTH / 2,
                    y: creationPoseLocationRef.current!.y - DRAGGABLE_OBJECT_HEIGHT / 2,
                    width: DRAGGABLE_OBJECT_WIDTH, height: DRAGGABLE_OBJECT_HEIGHT,
                    color: DRAGGABLE_OBJECT_COLOR, draggingColor: DRAGGABLE_OBJECT_DRAGGING_COLOR,
                    borderColor: DRAGGABLE_OBJECT_BORDER_COLOR,
                    isDragging: false, isHoveredByGrab: false, dragOffsetX: 0, dragOffsetY: 0,
                };
                currentFrameDraggableObjects = [...currentFrameDraggableObjects, newObj];
                creationPoseStartTimeRef.current = null; creationPoseLocationRef.current = null;
                if (creationProgressRef.current !== 0) setCreationProgress(0);
            }
        } else {
            if (creationPoseStartTimeRef.current !== null) {
                creationPoseStartTimeRef.current = null; creationPoseLocationRef.current = null;
                if (creationProgressRef.current !== 0) setCreationProgress(0);
            }
        }

        if (appModeRef.current === 'drawingPolygon' && isPointingPose && indexFingerForPointing) {
            if (pointingPoseStartTimeRef.current === null) {
                pointingPoseStartTimeRef.current = Date.now();
                pointingPoseLocationRef.current = indexFingerForPointing;
            }
            const elapsedTime = Date.now() - pointingPoseStartTimeRef.current;
            const newProgress = Math.min(1, elapsedTime / POINTING_HOLD_DURATION_MS);
            if (newProgress !== pointingProgressRef.current) setPointingProgress(newProgress);

            if (newProgress >= 1 && pointingPoseLocationRef.current) { // Ensure location is still valid
                setCurrentPolygonVertices(prev => [...prev, pointingPoseLocationRef.current!]);
                pointingPoseStartTimeRef.current = null; 
                // pointingPoseLocationRef.current = null; // Don't nullify here, let it be overwritten next frame or when pose ends
                if (pointingProgressRef.current !== 0) setPointingProgress(0);
            }
        } else {
            if (pointingPoseStartTimeRef.current !== null) {
                pointingPoseStartTimeRef.current = null; 
                // pointingPoseLocationRef.current = null; // Cleared if pose ends
                if (pointingProgressRef.current !== 0) setPointingProgress(0);
            }
        }
      } else { 
          if (creationPoseStartTimeRef.current !== null) {
              creationPoseStartTimeRef.current = null; creationPoseLocationRef.current = null;
              if (creationProgressRef.current !== 0) setCreationProgress(0);
          }
          if (pointingPoseStartTimeRef.current !== null) {
              pointingPoseStartTimeRef.current = null; pointingPoseLocationRef.current = null;
              if (pointingProgressRef.current !== 0) setPointingProgress(0);
          }
          currentGrabActive = false;
          grabMidpoint = null;
          isPointingPose = false; // Explicitly set to false
          isSquareCreationPose = false; // Explicitly set to false
      }
      
      let processedObjects = currentFrameDraggableObjects.map(obj => ({ ...obj, isHoveredByGrab: false }));
      let activeDraggingOccurred = false;
      
      if (currentGrabActive && grabMidpoint && creationProgressRef.current < 0.1 && pointingProgressRef.current < 0.1) {
          let targetObjId = currentlyDraggedObjectIdRef.current;
          let objectToDrag = targetObjId ? processedObjects.find(obj => obj.id === targetObjId) : null;

          if (!objectToDrag) {
              for (let i = processedObjects.length - 1; i >= 0; i--) {
                  const obj = processedObjects[i];
                  let isOverObject = false;
                  if (obj.shape === 'polygon' && obj.vertices) {
                      isOverObject = isPointInPolygon(grabMidpoint, obj.vertices);
                  } else { 
                      isOverObject = grabMidpoint.x >= obj.x && grabMidpoint.x <= obj.x + obj.width &&
                                    grabMidpoint.y >= obj.y && grabMidpoint.y <= obj.y + obj.height;
                  }
                  if (isOverObject) {
                      objectToDrag = obj;
                      currentlyDraggedObjectIdRef.current = obj.id;
                      break;
                  }
              }
          }

          if (objectToDrag) {
              activeDraggingOccurred = true;
              if (!objectToDrag.isDragging) {
                  objectToDrag.isDragging = true;
                  objectToDrag.dragOffsetX = grabMidpoint.x - objectToDrag.x; 
                  objectToDrag.dragOffsetY = grabMidpoint.y - objectToDrag.y;
              }
              const newObjX = grabMidpoint.x - objectToDrag.dragOffsetX;
              const newObjY = grabMidpoint.y - objectToDrag.dragOffsetY;

              const deltaX = newObjX - objectToDrag.x;
              const deltaY = newObjY - objectToDrag.y;

              objectToDrag.x = newObjX;
              objectToDrag.y = newObjY;
              
              if(objectToDrag.shape === 'square'){
                objectToDrag.x = Math.max(0, Math.min(objectToDrag.x, canvasElement.width - objectToDrag.width));
                objectToDrag.y = Math.max(0, Math.min(objectToDrag.y, canvasElement.height - objectToDrag.height));
              }

              if (objectToDrag.shape === 'polygon' && objectToDrag.vertices) {
                  objectToDrag.vertices = objectToDrag.vertices.map(v => ({
                      x: v.x + deltaX,
                      y: v.y + deltaY
                  }));
              }
          } else {
              currentlyDraggedObjectIdRef.current = null;
          }
      } else { 
          if (currentlyDraggedObjectIdRef.current) {
              const stillDraggingObj = processedObjects.find(obj => obj.id === currentlyDraggedObjectIdRef.current);
              if (stillDraggingObj && stillDraggingObj.isDragging) {
                  stillDraggingObj.isDragging = false;
              }
              currentlyDraggedObjectIdRef.current = null;
          }
      }
      
      if (currentGrabActive && grabMidpoint && !activeDraggingOccurred && creationProgressRef.current < 0.1 && pointingProgressRef.current < 0.1) {
          for (let i = processedObjects.length - 1; i >= 0; i--) {
              const obj = processedObjects[i];
              let isOverObject = false;
              if (obj.shape === 'polygon' && obj.vertices) {
                  isOverObject = isPointInPolygon(grabMidpoint, obj.vertices);
              } else { 
                  isOverObject = grabMidpoint.x >= obj.x && grabMidpoint.x <= obj.x + obj.width &&
                                  grabMidpoint.y >= obj.y && grabMidpoint.y <= obj.y + obj.height;
              }
              if (!obj.isDragging && isOverObject) {
                  if(!obj.isHoveredByGrab) obj.isHoveredByGrab = true; 
                  break; 
              }
          }
      }
      
      if (JSON.stringify(draggableObjectsRef.current) !== JSON.stringify(processedObjects)) {
          setDraggableObjects(processedObjects);
      }
      
      processedObjects.forEach(obj => drawDraggableObject(canvasCtx, obj));

      if (appModeRef.current === 'drawingPolygon') {
          const verticesToDraw = currentPolygonVerticesRef.current;
          if (verticesToDraw.length > 0) {
            verticesToDraw.forEach(v => {
                if (v && typeof v.x === 'number' && typeof v.y === 'number') {
                    canvasCtx.beginPath();
                    canvasCtx.arc(v.x, v.y, POLYGON_VERTEX_RADIUS, 0, 2 * Math.PI);
                    canvasCtx.fillStyle = POLYGON_IN_PROGRESS_VERTEX_COLOR;
                    canvasCtx.fill();
                }
            });
            if (verticesToDraw.length > 1) {
                canvasCtx.beginPath();
                const firstVertex = verticesToDraw[0];
                if (firstVertex && typeof firstVertex.x === 'number' && typeof firstVertex.y === 'number') {
                    canvasCtx.moveTo(firstVertex.x, firstVertex.y);
                    for (let i = 1; i < verticesToDraw.length; i++) {
                        const currentVertex = verticesToDraw[i];
                        if (currentVertex && typeof currentVertex.x === 'number' && typeof currentVertex.y === 'number') {
                           canvasCtx.lineTo(currentVertex.x, currentVertex.y);
                        } else { // If a vertex is bad, break to avoid further drawing errors with this line
                            break;
                        }
                    }
                    canvasCtx.strokeStyle = POLYGON_IN_PROGRESS_LINE_COLOR;
                    canvasCtx.lineWidth = 2;
                    canvasCtx.stroke();
                }
            }
          }
          // Draw line to current cursor position if there's at least one vertex and pointing finger is tracked
          if (verticesToDraw.length > 0 && indexFingerForPointing) { 
              const lastVertex = verticesToDraw[verticesToDraw.length - 1];
              if (lastVertex && typeof lastVertex.x === 'number' && typeof lastVertex.y === 'number' &&
                  typeof indexFingerForPointing.x === 'number' && typeof indexFingerForPointing.y === 'number') {
                  canvasCtx.beginPath();
                  canvasCtx.moveTo(lastVertex.x, lastVertex.y);
                  canvasCtx.lineTo(indexFingerForPointing.x, indexFingerForPointing.y);
                  canvasCtx.strokeStyle = POLYGON_IN_PROGRESS_CURSOR_LINE_COLOR;
                  canvasCtx.lineWidth = 2;
                  canvasCtx.setLineDash([5, 5]);
                  canvasCtx.stroke();
                  canvasCtx.setLineDash([]);
              }
          }
      }


      if (creationProgressRef.current > 0 && creationPoseLocationRef.current) {
          const loc = creationPoseLocationRef.current;
          canvasCtx.beginPath();
          canvasCtx.arc(loc.x, loc.y, CREATION_PROGRESS_RADIUS, 0, 2 * Math.PI);
          canvasCtx.fillStyle = CREATION_PROGRESS_BG_COLOR;
          canvasCtx.fill();
          canvasCtx.beginPath();
          canvasCtx.moveTo(loc.x, loc.y);
          canvasCtx.arc(loc.x, loc.y, CREATION_PROGRESS_RADIUS, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * creationProgressRef.current), false);
          canvasCtx.closePath();
          canvasCtx.fillStyle = CREATION_PROGRESS_COLOR;
          canvasCtx.fill();
      }
      if (pointingProgressRef.current > 0 && pointingPoseLocationRef.current) {
          const loc = pointingPoseLocationRef.current;
          canvasCtx.beginPath();
          canvasCtx.arc(loc.x, loc.y, POINTING_PROGRESS_RADIUS, 0, 2 * Math.PI);
          canvasCtx.fillStyle = CREATION_PROGRESS_BG_COLOR; 
          canvasCtx.fill();
          canvasCtx.beginPath();
          canvasCtx.moveTo(loc.x, loc.y);
          canvasCtx.arc(loc.x, loc.y, POINTING_PROGRESS_RADIUS, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * pointingProgressRef.current), false);
          canvasCtx.closePath();
          canvasCtx.fillStyle = POLYGON_IN_PROGRESS_VERTEX_COLOR; 
          canvasCtx.fill();
      }

      if (thumbTip) {
          canvasCtx.beginPath();
          canvasCtx.arc(thumbTip.x, thumbTip.y, FINGER_CURSOR_RADIUS, 0, 2 * Math.PI);
          canvasCtx.fillStyle = currentGrabActive ? GRAB_LINE_COLOR : 'rgba(255, 255, 255, 0.7)';
          canvasCtx.fill();
      }
      if (indexTip) { 
          canvasCtx.beginPath();
          canvasCtx.arc(indexTip.x, indexTip.y, FINGER_CURSOR_RADIUS, 0, 2 * Math.PI);
          canvasCtx.fillStyle = currentGrabActive ? GRAB_LINE_COLOR : (appModeRef.current === 'drawingPolygon' && isPointingPose ? POLYGON_IN_PROGRESS_VERTEX_COLOR : 'rgba(255, 255, 255, 0.7)');
          canvasCtx.fill();
      }
      if (currentGrabActive && thumbTip && indexTip) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(thumbTip.x, thumbTip.y);
          canvasCtx.lineTo(indexTip.x, indexTip.y);
          canvasCtx.strokeStyle = GRAB_LINE_COLOR;
          canvasCtx.lineWidth = 3;
          canvasCtx.stroke();
      }
      
      canvasCtx.restore();
    } catch (error) {
        console.error("Error during handleMediaPipeResults:", error);
        setErrorMessage(`Processing error: ${(error as Error).message}. Hand movement might have caused temporary landmark issues.`);
        
        pointingPoseStartTimeRef.current = null;
        pointingPoseLocationRef.current = null;
        if (pointingProgressRef.current !== 0) setPointingProgress(0);

        creationPoseStartTimeRef.current = null;
        creationPoseLocationRef.current = null;
        if (creationProgressRef.current !== 0) setCreationProgress(0);
        
        if(currentlyDraggedObjectIdRef.current) {
            setDraggableObjects(prevObs => prevObs.map(obj => obj.id === currentlyDraggedObjectIdRef.current ? {...obj, isDragging: false} : obj));
            currentlyDraggedObjectIdRef.current = null;
        }
    } finally {
        isProcessingRef.current = false;
    }
  }, [setCurrentPolygonVertices, setDraggableObjects, setCreationProgress, setPointingProgress, setErrorMessage]); 


  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) return;

    isCleaningUpRef.current = false; 
    canvasElement.width = VIDEO_WIDTH;
    canvasElement.height = VIDEO_HEIGHT;
    
    let localHandsInstance: MediaPipeHandsInstance | null = null;
    let localCameraInstance: MediaPipeCameraInstance | null = null;

    function initializeMediaPipe() {
      try {
        if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
            setErrorMessage('MediaPipe libraries not loaded yet. Retrying.');
            setLoadingMessage('Retrying MediaPipe initialization...');
            setTimeout(initializeMediaPipe, 1000); 
            return;
        }
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.65, 
          minTrackingConfidence: 0.65,
        });
        hands.onResults(handleMediaPipeResults); 
        handsInstanceRef.current = hands;
        localHandsInstance = hands;

        const camera = new window.Camera(videoElement, {
          onFrame: async () => {
            if (isCleaningUpRef.current || !handsInstanceRef.current || isProcessingRef.current) {
              return;
            }
            if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA && videoElement.videoWidth > 0) {
              try {
                const currentHands = handsInstanceRef.current; 
                if (currentHands) { 
                  await currentHands.send({ image: videoElement });
                }
              } catch (error) {
                if (!isCleaningUpRef.current) {
                  console.error('Error sending frame to MediaPipe Hands:', error);
                   setErrorMessage(`MediaPipe send error: ${(error as Error).message}`);
                }
              }
            }
          },
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        });
        cameraInstanceRef.current = camera;
        localCameraInstance = camera;

        camera.start()
          .then(() => {
            setLoadingMessage('');
            // Ensure video element style IS mirrored
            if (videoElement) {
              videoElement.style.transform = 'scaleX(-1)'; // Mirror video feed
            }
          })
          .catch((err: Error) => {
            console.error("Failed to start camera:", err);
            setErrorMessage(`Failed to start camera: ${err.message}. Ensure permissions are granted.`);
            setLoadingMessage('');
          });
      } catch (err) {
        console.error("Error initializing MediaPipe:", err);
        setErrorMessage(`Failed to initialize MediaPipe: ${(err as Error).message}.`);
        setLoadingMessage('');
      }
    }
    
    if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined' || typeof window.drawConnectors === 'undefined' || typeof window.drawLandmarks === 'undefined') {
      setLoadingMessage('Loading MediaPipe libraries...');
      const checkInterval = setInterval(() => {
        if (typeof window.Hands !== 'undefined' && typeof window.Camera !== 'undefined' && typeof window.drawConnectors !== 'undefined' && typeof window.drawLandmarks !== 'undefined') {
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
      isCleaningUpRef.current = true; 
      console.log("Cleaning up App component MediaPipe instances...");
      
      if (localCameraInstance) { 
        try {
          if (typeof localCameraInstance.close === 'function') {
            localCameraInstance.close();
          } else {
            console.warn("localCameraInstance.close was not a function during cleanup. Attempting manual video stream stop.");
             if (localCameraInstance.video && localCameraInstance.video.srcObject) {
                const stream = localCameraInstance.video.srcObject as MediaStream;
                if (stream && typeof stream.getTracks === 'function') {
                    stream.getTracks().forEach(track => track.stop());
                }
            } else if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                 if (stream && typeof stream.getTracks === 'function') {
                    stream.getTracks().forEach(track => track.stop());
                }
                videoRef.current.srcObject = null;
            }
          }
        } catch (e) { 
            console.error("Error during localCameraInstance.close or fallback cleanup:", e);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                 if (stream && typeof stream.getTracks === 'function') {
                    stream.getTracks().forEach(track => track.stop());
                }
                videoRef.current.srcObject = null;
            }
        }
      } else if (videoRef.current && videoRef.current.srcObject) {
        console.log("localCameraInstance was null in cleanup, cleaning videoRef.current's stream directly.");
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = null;
      }
      cameraInstanceRef.current = null;

      if (localHandsInstance) { 
        if (typeof localHandsInstance.close === 'function') {
            localHandsInstance.close().catch(e => console.error("Error closing Hands instance:", e));
        } else {
            console.warn("localHandsInstance.close was not a function during cleanup.");
        }
      }
      handsInstanceRef.current = null;
      
      isProcessingRef.current = false;
      creationPoseStartTimeRef.current = null; 
      creationPoseLocationRef.current = null;
      pointingPoseStartTimeRef.current = null;
      pointingPoseLocationRef.current = null;
      currentlyDraggedObjectIdRef.current = null;
    };
  }, [handleMediaPipeResults, setErrorMessage]); 

  const toggleAppMode = () => {
    setAppMode(prev => {
      const newMode = prev === 'idle' ? 'drawingPolygon' : 'idle';
      if (newMode === 'idle' && currentPolygonVertices.length > 0) { // Clear partial polygon if switching away
        setCurrentPolygonVertices([]);
        setPointingProgress(0);
        pointingPoseStartTimeRef.current = null;
        pointingPoseLocationRef.current = null;
      }
      return newMode;
    });
  };

  const handleFinishPolygon = () => {
    if (currentPolygonVertices.length < POLYGON_MIN_VERTICES) {
      setErrorMessage("A polygon needs at least 3 vertices.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    const newPolygon: DraggableObjectState = {
      id: `obj-poly-${Date.now()}`,
      shape: 'polygon',
      vertices: [...currentPolygonVerticesRef.current], // Use ref for most up-to-date vertices
      x: Math.min(...currentPolygonVerticesRef.current.map(v => v.x)),
      y: Math.min(...currentPolygonVerticesRef.current.map(v => v.y)),
      width: Math.max(...currentPolygonVerticesRef.current.map(v => v.x)) - Math.min(...currentPolygonVerticesRef.current.map(v => v.x)),
      height: Math.max(...currentPolygonVerticesRef.current.map(v => v.y)) - Math.min(...currentPolygonVerticesRef.current.map(v => v.y)),
      color: POLYGON_COLOR,
      draggingColor: POLYGON_DRAGGING_COLOR,
      borderColor: DRAGGABLE_OBJECT_BORDER_COLOR,
      isDragging: false,
      isHoveredByGrab: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
    };
    setDraggableObjects(prev => [...prev, newPolygon]);
    setCurrentPolygonVertices([]);
    setPointingProgress(0);
    pointingPoseStartTimeRef.current = null;
    pointingPoseLocationRef.current = null;
    setAppMode('idle');
  };

  const handleCancelDrawing = () => {
    setCurrentPolygonVertices([]);
    setPointingProgress(0);
    pointingPoseStartTimeRef.current = null;
    pointingPoseLocationRef.current = null;
    // No need to change appMode here, user might want to restart drawing
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-2 bg-slate-900 text-slate-100 select-none font-['Inter',_sans-serif]">
      <header className="text-center mb-2">
        <h1 className="text-4xl font-bold text-sky-400 mb-1">Gesture Object Interact</h1>
        <p className="text-slate-300 text-lg">
          {appMode === 'idle' ? 'Create squares or drag objects. View is mirrored (like a webcam).' : 'Drawing Polygon: Use pointing gesture to add vertices. View is mirrored.'}
        </p>
      </header>

      <div className="flex space-x-2 my-2">
        <button
          onClick={toggleAppMode}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-75
            ${appMode === 'drawingPolygon' 
              ? 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400' 
              : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400'}`}
          aria-live="polite"
        >
          {appMode === 'idle' ? 'Start Drawing Polygon' : 'Switch to Object Mode'}
        </button>
        {appMode === 'drawingPolygon' && (
          <>
            <button
              onClick={handleFinishPolygon}
              disabled={currentPolygonVertices.length < POLYGON_MIN_VERTICES}
              className="px-4 py-2 rounded-lg font-semibold bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-500 disabled:opacity-70 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              Finish Polygon ({currentPolygonVertices.length})
            </button>
            <button
              onClick={handleCancelDrawing}
              disabled={currentPolygonVertices.length === 0}
              className="px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-500 disabled:opacity-70 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
            >
              Cancel Current
            </button>
          </>
        )}
      </div>

      <div className="status-messages space-y-2 text-center w-full max-w-lg">
        {loadingMessage && (
          <div role="status" aria-live="polite" className="p-3 bg-sky-600/50 text-sky-200 rounded-lg shadow-md inline-flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-sky-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{loadingMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="p-3 bg-red-600/90 text-red-100 rounded-lg shadow-md">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{errorMessage}</p>
            <p className="mt-1 text-xs">Try adjusting hand position or refreshing. Check camera permissions.</p>
          </div>
        )}
      </div>

      <div className="video-container rounded-lg overflow-hidden shadow-2xl border-2 border-sky-700/60" style={{width: VIDEO_WIDTH, height: VIDEO_HEIGHT}}>
        {/* Video element style is controlled by React/JS to ensure mirrored view */}
        <video ref={videoRef} style={{ display: 'block', transform: 'scaleX(-1)' }} playsInline autoPlay muted></video>
        <canvas ref={canvasRef} className="block"></canvas>
      </div>

      <footer className="mt-2 text-sm text-slate-400 text-center max-w-xl space-y-1">
        <p><strong>{appMode === 'drawingPolygon' ? 'Point (Extend Index, Curl Others)' : 'Create Square (Open Palm)'}:</strong> Hold pose to {appMode === 'drawingPolygon' ? 'add vertex.' : 'create.'}</p>
        <p><strong>Drag:</strong> Pinch thumb & index finger over an object to move.</p>
        <p>View IS mirrored: Like a webcam, your right hand appears as right. Ensure good lighting and a clear view of your hand. Powered by MediaPipe Hands & React.</p>
      </footer>
    </div>
  );
};

export default App;
