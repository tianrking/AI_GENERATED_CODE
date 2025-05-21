
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type AppMode = 'idle' | 'drawingPolygon';

export interface DraggableObjectState {
  id: string;
  x: number; // Bounding box top-left x
  y: number; // Bounding box top-left y
  width: number; // Bounding box width
  height: number; // Bounding box height
  color: string;
  draggingColor: string;
  borderColor: string;
  isDragging: boolean;
  isHoveredByGrab: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  shape: 'square' | 'polygon';
  vertices?: { x: number, y: number }[]; // Only for polygons, absolute canvas coordinates
}

// For MediaPipe loaded via CDN
export interface MediaPipeHandsInstance {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: any) => void) => void;
  send: (options: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }) => Promise<void>;
  close: () => Promise<void>;
}

export interface MediaPipeCameraInstance {
  start: () => Promise<void>;
  close: () => void;
  video?: HTMLVideoElement;
}

export interface MediaPipeHandsConstructor {
  new(config?: any): MediaPipeHandsInstance;
  HAND_CONNECTIONS: any[][];
}

declare global {
  interface Window {
    Hands: MediaPipeHandsConstructor;
    Camera: new (videoElement: HTMLVideoElement, options: any) => MediaPipeCameraInstance;
    drawConnectors: (
      ctx: CanvasRenderingContext2D,
      landmarks: HandLandmark[],
      connections: any[][],
      options: { color: string; lineWidth: number }
    ) => void;
    drawLandmarks: (
      ctx: CanvasRenderingContext2D,
      landmarks: HandLandmark[],
      options: { color: string; lineWidth?: number; radius?: number }
    ) => void;
  }
}