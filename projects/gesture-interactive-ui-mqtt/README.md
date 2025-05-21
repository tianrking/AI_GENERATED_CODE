
# Gesture-Controlled Smart Home Switch Interface

This web application allows users to control virtual smart home switches using hand gestures detected via their device's camera. When a switch is toggled, its new state (ON/OFF) is published to a public MQTT broker, enabling integration with other smart home systems or monitoring tools.

## Features

*   **Hand Gesture Detection:** Uses MediaPipe Hands to detect the user's index finger.
    *   **Point:** Hover over a switch.
    *   **Pinch (Quick):** Bring index fingertip close to the PIP joint to "click" and toggle a switch.
    *   **Long Press (Hold):** Hold the "pinch" gesture for 2 seconds to toggle a switch.
*   **Virtual Switches:** Three interactive buttons on the screen represent smart home devices:
    1.  Living Room Light
    2.  Kitchen Fan
    3.  Bedroom Lamp
*   **Visual Feedback:** Buttons change appearance on hover, activation (ON/OFF state), and during the trigger action. A progress bar indicates a long press.
*   **MQTT Integration:** Switch state changes are published to a public MQTT broker.
*   **Real-time UI:** Built with React and TypeScript for a responsive experience.

## Setup and Running

1.  **Prerequisites:** A modern web browser (Chrome, Firefox, Edge, Safari) with camera access.
2.  **Open the Application:** Simply open the `index.html` file in your web browser.
3.  **Grant Camera Permission:** When prompted, allow the browser to access your camera. The application needs this to detect hand gestures.

## Gesture Interaction

*   **Hover:** Point your index finger directly at one of the virtual switch buttons. The button will highlight.
*   **Toggle (Click):** While hovering, quickly bring your index fingertip close to the knuckle (PIP joint) of the same finger. This simulates a click and will toggle the switch's state (ON to OFF, or OFF to ON).
*   **Toggle (Long Press):** While hovering, bring your index fingertip close to the knuckle and hold the position. A progress indicator will fill up on the button. Once filled (after 2 seconds), the switch will toggle.
*   **Fingertip Cursor:** A small cyan circle on the screen represents your detected index fingertip, helping you aim at the buttons.

## MQTT Integration Details

When a switch is toggled, a message is sent to a public MQTT broker.

*   **Broker Address:** `wss://broker.hivemq.com:8884/mqtt` (HiveMQ Public Broker, Secure WebSocket)
*   **Topic Structure:** `gestureUI/switch/{buttonId}/state`
    *   `{buttonId}` will be `btn-0`, `btn-1`, or `btn-2`.
    *   Example topic for the first switch: `gestureUI/switch/btn-0/state`
*   **Message Payload Format (JSON):**
    ```json
    {
      "id": "btn-0",                 // The unique ID of the switch button
      "name": "Living Room Light",   // The label of the switch
      "state": "ON",                 // The new state of the switch ("ON" or "OFF")
      "timestamp": "2024-04-18T12:00:00.000Z" // ISO 8601 timestamp of the event
    }
    ```

### Subscribing to Messages

You can use any MQTT client to subscribe to these topics and receive real-time updates from the gesture interface.

**Example using `mqtt-cli` (Node.js tool):**

First, install `mqtt-cli`:
```bash
npm install mqtt-cli -g
```

Then, subscribe to all switch state changes:
```bash
mqtt sub -h broker.hivemq.com -p 8884 --protocol wss -t 'gestureUI/switch/+/state' -v
```
*   `-h`: broker hostname
*   `-p`: broker port (8884 for WSS)
*   `--protocol wss`: specify Secure WebSocket protocol
*   `-t`: topic to subscribe to (`+` is a single-level wildcard)
*   `-v`: verbose mode (prints topic along with message)

**Example using Python (paho-mqtt):**
```python
import paho.mqtt.client as mqtt
import json

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"Connected with result code {rc}")
    # Subscribe to the topic(s) of interest
    client.subscribe("gestureUI/switch/+/state")

def on_message(client, userdata, msg):
    print(f"Received message on topic {msg.topic}:")
    try:
        payload = json.loads(msg.payload.decode())
        print(json.dumps(payload, indent=2))
    except json.JSONDecodeError:
        print(f"Raw payload: {msg.payload.decode()}")

# Create a client instance specifying MQTT version and transport
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="my_gesture_subscriber_secure", transport="websockets")

client.on_connect = on_connect
client.on_message = on_message

# Set WSS options
client.ws_options_set(path="/mqtt") 
client.tls_set() # Enable SSL/TLS for WSS

# Connect to the broker
try:
    client.connect("broker.hivemq.com", 8884, 60) # Port 8884 for WSS
except Exception as e:
    print(f"Connection failed: {e}")
    exit()

# Start the network loop
client.loop_forever()
```

## Technologies Used

*   **Frontend:** React, TypeScript
*   **Gesture Detection:** MediaPipe Hands
*   **Styling:** Tailwind CSS
*   **MQTT Communication:** MQTT.js (via CDN)

## Troubleshooting

*   **No Camera Feed / Gesture Detection Not Working:**
    *   Ensure you have granted camera permissions to your browser for this page.
    *   Check if another application is using your camera.
    *   Ensure good lighting and a clear, unobstructed view of your hand.
    *   Try refreshing the page.
*   **MQTT Disconnected/Error:**
    *   Check your internet connection.
    *   The public MQTT broker (`broker.hivemq.com`) might be temporarily unavailable or have connection limits.
    *   The UI displays the current MQTT connection status. If it shows "operation is insecure" or similar, ensure the app is trying to connect via `wss://` as configured.
*   **Gestures Not Registering Accurately:**
    *   Keep your hand relatively stable.
    *   Ensure a plain background behind your hand if possible.
    *   The "click" gesture requires a quick motion of bringing the fingertip towards the PIP joint (middle knuckle of the finger).
