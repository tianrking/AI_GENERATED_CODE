
# Gesture Object Creator & Dragger & Drawer

This web application allows users to interact with a digital canvas using hand gestures detected via their device camera. Users can:
*   Create draggable square objects.
*   Draw custom draggable polygon objects.
*   Move these objects around the screen.

The video display IS **mirrored**, providing a natural "webcam" or "mirror-like" experience. This means if you move your physical right hand to your right, the hand on screen appears to move towards its right (which is the left side of the actual screen).

This project utilizes:
*   React and TypeScript for the frontend application structure.
*   MediaPipe Hands for real-time hand tracking and gesture recognition.
*   TailwindCSS for styling.

## Features

*   **Real-time Hand Tracking:** Visualizes your hand landmarks (joints) and connections (bones) on the screen.
*   **Mirrored View:** Video and canvas are mirrored. This is like looking in a mirror; your right hand's movements correspond to the right hand on screen.
*   **Multiple Interaction Modes:** Switch between object interaction/creation and polygon drawing modes.
*   **Square Object Creation Gesture:** Create new draggable squares using an "open palm" hand pose.
*   **Polygon Drawing Gesture ("Pointing"):** Define vertices of a custom polygon by extending your index finger while curling others.
*   **Object Dragging Gesture ("Pinch"):** Grab and move created squares or polygons using a pinch gesture.
*   **Visual Feedback:** Clear visual cues for gestures, object states (default, hovered, dragging), creation progress, and polygon drawing progress.
*   **UI Controls:** Buttons to manage drawing modes and finalize/cancel polygon creation.

## How to Run

1.  Ensure you have a modern web browser with camera access.
2.  Open the `index.html` file in your browser.
3.  Grant camera permissions when prompted by the browser.

## Application Modes & UI Controls

The application has two main modes, controlled by buttons:

1.  **Object Mode (Default):**
    *   Allows creation of square objects and dragging of any existing object.
    *   Button: "**Start Drawing Polygon**" - Click to switch to Polygon Drawing Mode.

2.  **Polygon Drawing Mode:**
    *   Allows defining vertices for a new polygon using the "Pointing" gesture.
    *   Button: "**Switch to Object Mode**" - Click to return to Object Mode. (If you have unfinalized vertices for a polygon, they will be cleared).
    *   Button: "**Finish Polygon (count)**" - Enabled when you have at least 3 vertices for the current polygon. Click to finalize it. The polygon becomes a draggable object, and the app returns to Object Mode. The number in parentheses shows the current vertex count.
    *   Button: "**Cancel Current**" - Enabled when you have placed at least one vertex for the current polygon. Click to discard the current in-progress polygon's vertices. You remain in Polygon Drawing Mode.

## Gesture Interactions

The application primarily uses one hand (the first detected hand) for interactions. Ensure your hand is clearly visible to the camera with good lighting. Remember, the display is **mirrored**.

---

### 1. Square Object Creation

*   **Mode:** Active only in **Object Mode**.
*   **Purpose:** To create a new draggable square.
*   **Gesture Name:** "Open Palm"
*   **Hand Pose:**
    *   Extend your **index, middle, ring, and pinky fingers** outwards, away from your palm. They should be relatively straight.
    *   Your **thumb** should also be extended, generally away from the palm.
    *   **Crucially:** Ensure your thumb and index finger are **NOT** close together or touching (i.e., not forming a "Pinch" or "Grab" gesture). The system prioritizes the pinch gesture if it's detected.
*   **Process & Visual Feedback:**
    1.  Enter **Object Mode** (this is the default mode).
    2.  Make the "Open Palm" gesture.
    3.  A yellow circular **progress indicator** will appear at the center of your palm on the mirrored display. This indicates the gesture is recognized and creation is initiating.
    4.  **Hold this pose steadily** for approximately **1.5 seconds**. The yellow circle will fill up clockwise.
*   **Outcome:**
    *   Once the progress circle is full, a new blue draggable square object will be created and will appear at the location of your palm center at the moment of completion.
    *   The progress circle will disappear.
*   **Tips:**
    *   If the progress circle doesn't appear, check that your fingers are well-extended and that your thumb isn't too close to your index finger.
    *   A brief flicker or change in hand pose can reset the progress.

---

### 2. Polygon Vertex Placement

*   **Mode:** Active only in **Polygon Drawing Mode**.
*   **Purpose:** To define the points (vertices) of a custom polygon, one by one.
*   **Gesture Name:** "Pointing"
*   **Hand Pose:**
    *   Extend your **index finger** straight, as if pointing at something.
    *   Curl your **middle, ring, and pinky fingers** fully towards your palm. They should be closed into a fist-like position.
    *   Your **thumb** can be in a relaxed position, either alongside your palm or slightly curled, but it should **NOT** be pinching against your index finger.
*   **Process & Visual Feedback:**
    1.  Click the "**Start Drawing Polygon**" button to enter Polygon Drawing Mode.
    2.  Make the "Pointing" gesture. Your index fingertip (on the mirrored display) acts as a cursor.
    3.  Position your extended index fingertip at the location where you want to place a vertex for your polygon.
    4.  **Hold the "Pointing" pose steadily** with your fingertip at the desired location.
    5.  A small yellow **progress indicator** will appear at your index fingertip.
    6.  Continue holding for approximately **0.7 seconds**. The small yellow circle will fill up.
*   **Outcome:**
    *   Once the progress circle is full, a new **vertex** (a small, solid yellow circle) for the current polygon is placed at your index fingertip's location.
    *   The progress circle will disappear.
    *   Repeat this process to add more vertices.
*   **Visual Cues During Drawing:**
    *   **Placed Vertices:** Appear as small, solid yellow circles.
    *   **Connecting Lines:** As you place more than one vertex, gray lines will connect them in sequence.
    *   **Live Cursor Line:** If you have at least one vertex placed, a dashed yellow line will dynamically connect the last placed vertex to your current index fingertip, showing where the next line segment would go.
    *   **Index Tip Highlight:** While successfully holding the "Pointing" pose, your index fingertip cursor itself will be highlighted in yellow.
*   **Finalizing the Polygon:**
    *   After placing at least **3 vertices**, the "**Finish Polygon**" button becomes active. Click it to complete the polygon. It will turn purple and become a draggable object. The application will return to Object Mode.
*   **Canceling:**
    *   Use the "**Cancel Current**" button to discard the vertices you've placed for the current polygon and start over if needed.

---

### 3. Object Dragging (Grab and Move)

*   **Mode:** Active in **both Object Mode and Polygon Drawing Mode** (for already created/finalized objects).
*   **Purpose:** To pick up and move existing squares or polygons.
*   **Gesture Name:** "Pinch" or "Grab"
*   **Hand Pose:**
    *   Bring the tip of your **thumb** and the tip of your **index finger** close together, as if you are about to pinch or pick up a small item. The distance between them should be relatively small.
    *   Other fingers can be in any position (curled or relaxed).
*   **Process & Visual Feedback:**
    1.  **Activate Pinch Gesture:**
        *   Make the "Pinch" pose.
        *   **Visual Cue:** Your thumb and index fingertips (on the mirrored display) will be highlighted with yellow circles, and a yellow line will connect them. This confirms the pinch gesture is active.
    2.  **Hovering (Pre-Grab):**
        *   While maintaining the pinch, move your hand so that the yellow line (or the midpoint between your thumb and index tips) is over a draggable object.
        *   **Visual Cue:** The object will highlight to indicate it's "hovered" and can be grabbed:
            *   Squares: Turn a lighter blue.
            *   Polygons: Turn a lighter purple.
    3.  **Grabbing an Object:**
        *   Ensure your pinching fingers are positioned directly over the object you want to grab.
        *   The system automatically "grabs" the topmost object under your pinch.
        *   **Visual Cue:** The object will change color to indicate it's "grabbed" and being dragged:
            *   Squares: Turn green.
            *   Polygons: Turn a distinct shade of violet.
    4.  **Moving an Object:**
        *   While maintaining the pinch gesture and the object is "grabbed" (green/violet), move your hand.
        *   The grabbed object will follow your hand's movements on the mirrored display.
    5.  **Releasing an Object:**
        *   Separate your thumb and index finger (i.e., stop pinching).
        *   **Visual Cue:** The object will revert to its default color (blue for squares, purple for polygons) and will remain at its last position. The yellow highlights on your fingertips and the connecting line will disappear.
*   **Important Notes for Dragging:**
    *   If you are holding a creation pose (Open Palm or Pointing) and its progress circle is significantly filled, dragging will be temporarily disabled to prevent accidental creation/dragging conflicts.
    *   The application detects a grab on the "topmost" object if multiple objects overlap.

---

### General Visual Feedback (Always Active)

*   **Hand Landmarks:** Small red dots represent the detected joints of your hand.
*   **Hand Connections:** Green lines connect the landmarks to show the skeletal structure of your hand.
*   **Video Feed:** Your live camera feed is displayed, mirrored.

## Troubleshooting

*   **No camera feed / "Failed to start camera" / "MediaPipe libraries not loaded":**
    *   Ensure you have granted camera permissions to your browser for this page.
    *   Make sure no other application is currently using your camera.
    *   Try refreshing the page.
    *   Check your internet connection (MediaPipe libraries are loaded from a CDN).
*   **Gestures not detected reliably or inconsistently:**
    *   **Lighting:** Ensure your hand is well-lit, avoiding strong backlighting or shadows.
    *   **Visibility:** Your hand should be fully visible within the camera frame.
    *   **Speed:** Avoid extremely fast or jerky hand movements. Smooth, deliberate motions work best.
    *   **Background:** A plain, non-cluttered background can sometimes improve detection accuracy.
    *   **Finger Separation:** For the "Open Palm" gesture, ensure clear separation between all fingers. For "Pointing," ensure the non-pointing fingers are distinctly curled.
    *   **Pinch Precision:** For "Pinch," make sure your thumb and index tips are clearly close.

## Technology Stack

*   **HTML, CSS, JavaScript (ES6+)**
*   **React 19** (via ESM import)
*   **TypeScript**
*   **MediaPipe Hands** (via CDN for `hands.js`, `camera_utils.js`, `drawing_utils.js`)
*   **TailwindCSS** (via CDN)

This project runs directly in the browser without requiring a separate build step.
    