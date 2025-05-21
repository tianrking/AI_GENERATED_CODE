
import { DraggableObjectState } from './types';

export const VIDEO_WIDTH = 640;
export const VIDEO_HEIGHT = 480;

// Draggable Object Constants
export const DRAGGABLE_OBJECT_WIDTH = 80;
export const DRAGGABLE_OBJECT_HEIGHT = 80;
export const DRAGGABLE_OBJECT_COLOR = 'rgba(59, 130, 246, 0.85)'; // Blue-500
export const DRAGGABLE_OBJECT_DRAGGING_COLOR = 'rgba(34, 197, 94, 0.9)'; // Green-500
export const DRAGGABLE_OBJECT_HOVER_COLOR = 'rgba(96, 165, 250, 0.85)'; // Lighter blue for hover
export const DRAGGABLE_OBJECT_BORDER_COLOR = 'rgba(255, 255, 255, 0.9)';

// Polygon Constants
export const POLYGON_COLOR = 'rgba(168, 85, 247, 0.85)'; // Purple-500
export const POLYGON_DRAGGING_COLOR = 'rgba(139, 92, 246, 0.9)'; // Violet-500
export const POLYGON_HOVER_COLOR = 'rgba(192, 132, 252, 0.85)'; // Lighter purple for hover
export const POLYGON_IN_PROGRESS_VERTEX_COLOR = 'rgba(250, 204, 21, 0.9)'; // Yellow-400
export const POLYGON_IN_PROGRESS_LINE_COLOR = 'rgba(229, 231, 235, 0.7)'; // Gray-200
export const POLYGON_IN_PROGRESS_CURSOR_LINE_COLOR = 'rgba(253, 224, 71, 0.7)'; // Yellow-300 dashed
export const POLYGON_MIN_VERTICES = 3;
export const POLYGON_VERTEX_RADIUS = 5;


// Gesture Constants for Dragging
export const THUMB_TIP_LANDMARK_INDEX = 4;
export const INDEX_FINGER_TIP_LANDMARK_INDEX = 8;
export const GRAB_DISTANCE_THRESHOLD = 55;
export const FINGER_CURSOR_RADIUS = 8;
export const GRAB_LINE_COLOR = 'rgba(253, 224, 71, 0.9)';

// Gesture Constants for Square Creation
export const CREATION_PALM_CENTER_LANDMARK_INDEX = 9; // Middle finger MCP as palm center proxy
export const CREATION_FINGER_TIP_LANDMARK_INDICES = {
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20,
};
export const MIN_FINGER_EXTENSION_FOR_CREATION_THRESHOLD = 50;
export const CREATION_HOLD_DURATION_MS = 1500;
export const CREATION_PROGRESS_RADIUS = 30;
export const CREATION_PROGRESS_COLOR = 'rgba(250, 204, 21, 0.7)';
export const CREATION_PROGRESS_BG_COLOR = 'rgba(255, 255, 255, 0.2)';

// Gesture Constants for Polygon Vertex Placement (Pointing)
export const POINTING_HOLD_DURATION_MS = 700; // 0.7 seconds to place a vertex
export const POINTING_PROGRESS_RADIUS = 20;

// Landmark indices for pointing gesture detection
export const INDEX_FINGER_MCP_LANDMARK_INDEX = 5;
export const MIDDLE_FINGER_TIP_LANDMARK_INDEX = 12;
export const MIDDLE_FINGER_MCP_LANDMARK_INDEX = 9;
export const RING_FINGER_TIP_LANDMARK_INDEX = 16;
export const RING_FINGER_MCP_LANDMARK_INDEX = 13;
export const PINKY_TIP_LANDMARK_INDEX = 20;
export const PINKY_MCP_LANDMARK_INDEX = 17;

// Thresholds for pointing gesture (distances in pixels on canvas)
// Index finger must be extended further than this from its MCP joint
export const POINTING_INDEX_EXTENSION_MIN_DIST = 40;
// Other fingers (middle, ring, pinky) must be curled, i.e., tip closer than this to their MCP joint
export const POINTING_OTHER_FINGER_CURLED_MAX_DIST = 45;
