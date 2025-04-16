# **App Name**: FloodSense

## Core Features:

- Interactive Map Display: Display a map with sensor locations indicated by markers. The marker color will change based on flood risk level.
- Sensor Data Popups: Display key sensor readings (water level, rain, etc.) and the flood risk status when a user interacts with a marker.
- Rule-Based Risk Assessment: Implement a rule-based tool to determine flood risk status based on sensor readings and weather data. The LLM will use its reasoning capabilities to evaluate when to change flood status.
- Real-Time Alert Notifications: Display push notifications when flood risk status changes for a sensor.

## Style Guidelines:

- Primary color: Dark blue (#003049) to convey trustworthiness and stability.
- Secondary color: Light blue (#87CEEB) to represent water and clarity.
- Accent: Orange (#D62828) for alerts and critical information.
- Use clear and intuitive icons for sensor types, status indicators, and alert levels.
- Clean and uncluttered layout for map display and sensor data presentation.

## Original User Request:
Objective: Generate the complete software stack (Backend, AI/ML logic, API integrations, Frontend Mobile App) for "FloodWatch AI", a real-time flood detection, prediction, and alert system.
Core Technologies:
Backend: Firebase (Firestore, Cloud Functions - preferably Node.js or Python)
AI/ML: Python (using libraries like scikit-learn, pandas) or Node.js (using TensorFlow.js or similar) - integrated within Cloud Functions.
External APIs: Weather API (e.g., OpenWeatherMap), Twilio API (for SMS)
Frontend: Android Application (Kotlin or Java) using Google Maps SDK and Firebase SDKs.
I. Firebase Backend Components:
Firestore Database Schema:
Define a Firestore collection named flood_sensor_nodes.
Each document in this collection represents a physical sensor node, identified by a unique deviceId (e.g., "node_001").
Each document should contain the following fields:
deviceId: String (Document ID)
location: GeoPoint (for mapping, e.g., { latitude: 21.1458, longitude: 79.0882 })
latest_reading: Map (object) containing the most recent sensor data packet. Structure this map to hold fields like:
timestamp: Timestamp or Number (Unix epoch)
waterLevel_cm: Number
rainDetected: Boolean
turbidity_ntu: Number
temperature_c: Number
humidity_percent: Number
pressure_hpa: Number
battery_level: Number (Optional)
status: String (e.g., "Normal", "Watch", "Warning", "Predicted_Flood", "Error"). Default to "Normal". This will be updated by the prediction logic.
predicted_flood_risk: Number (e.g., a score 0-1 or risk level 0-3). Default to 0. Updated by prediction logic.
last_updated: Timestamp (Server timestamp when the document was last updated by functions).
(Optional but Recommended): Consider a subcollection readings_history under each node document to store historical time-series data if needed for more advanced analysis or charting, but prioritize the latest_reading field for real-time status.
Cloud Functions (Node.js or Python):
ingestSensorData Function:
Trigger: HTTP Request (callable endpoint for NodeMCU).
Input: JSON payload matching the latest_reading structure plus deviceId.
Logic:
Validate incoming data (basic checks for required fields, types).
Get deviceId from the request.
Update the corresponding document in flood_sensor_nodes:
Set/Update the latest_reading map with the new data.
Set/Update the location if provided or if it needs updating.
Update last_updated with server timestamp.
Output: HTTP response (e.g., 200 OK or error codes).
runFloodPrediction Function:
Trigger: Firestore Trigger (on update of any document in flood_sensor_nodes) OR Scheduled Trigger (e.g., every 5 minutes, iterating through relevant nodes). Firestore trigger is preferred for near real-time updates.
Input: Firestore document snapshot (for trigger) or fetched data (for schedule).
Logic:
Extract latest_reading, location, and potentially previous readings/status from the Firestore document.
Weather API Integration: Call a Weather API (e.g., OpenWeatherMap using the location GeoPoint) to get current conditions (rainfall intensity) and short-term forecast (e.g., predicted rain in next 1-3 hours). Handle API key securely.
ML/Rule Engine Execution:
Calculate derived features (e.g., rate of change of water level, rate of change of turbidity).
Input current sensor readings, derived features, and weather API data into the prediction model/rules.
Implement a Rule-Based System first: Define thresholds for waterLevel_cm, rate of change, turbidity_ntu, current/forecasted rain to determine status ("Normal", "Watch", "Warning") and predicted_flood_risk.
(Optional ML): If feasible, implement a simple ML model (e.g., Logistic Regression, Decision Tree trained on simulated data) to predict predicted_flood_risk (0-1) based on the inputs. Map this risk score to the status.
Update the Firestore document with the calculated status and predicted_flood_risk.
Trigger Alert: If the new status/risk exceeds a predefined threshold (e.g., moves to "Warning" or risk > 0.7), invoke the sendAlerts function (pass relevant data like deviceId, status, waterLevel_cm, location).
sendAlerts Function:
Trigger: Callable Function (called by runFloodPrediction) or potentially Pub/Sub topic.
Input: Data object containing deviceId, status, waterLevel_cm, location, potentially user identifiers or target phone numbers/FCM tokens.
Logic:
Format an alert message (e.g., "Flood [Status] Alert for Node [deviceId] near [location]. Water Level: [waterLevel_cm]cm. Risk: [status/risk]").
FCM Push Notification: Query Firestore for users/devices subscribed to alerts for this location/node (requires user profiles/subscriptions - simplify for hackathon if needed: send to all). Send notification via Firebase Admin SDK.
Twilio SMS Integration: Use the Twilio API (Node.js/Python SDK) to send the formatted alert message via SMS to pre-configured phone numbers. Handle Twilio credentials securely.
II. Android Application (Kotlin or Java):
Map Integration:
Use the Google Maps SDK for Android.
Implement a primary Activity/Fragment displaying the map.
Real-time Data Fetching: Set up a Firestore real-time listener for the flood_sensor_nodes collection.
Marker Display:
For each document received from Firestore, display a custom marker on the map at its location (GeoPoint).
Dynamically Style Markers: Change the marker icon/color based on the status field read from Firestore (e.g., Green for "Normal", Yellow for "Watch", Orange for "Warning", Red for "Predicted_Flood"). Ensure markers update visually in real-time as Firestore data changes.
Implement map clustering if expecting many nodes.
Marker Interaction: When a marker is tapped, display an InfoWindow or a BottomSheet showing details: deviceId, key latest_reading values (water level, rain, turbidity, temp, timestamp), current status, and predicted_flood_risk.
Firebase Cloud Messaging (FCM):
Integrate FCM SDK.
Implement a FirebaseMessagingService to receive incoming push notifications (sent by the sendAlerts function).
Display received alerts as standard Android notifications. Clicking the notification should ideally open the app, perhaps navigating to the relevant marker on the map.
User Interface:
Clean display of map and markers.
(Optional) A separate screen or list view to show a history of received alerts.
(Optional) Detail screen for a specific sensor node showing historical charts (requires fetching from readings_history or storing history locally).
III. Assumptions & Constraints:
NodeMCU hardware code and sensor interfacing are handled separately. This prompt focuses only on the cloud and mobile software.
API Keys (Weather API, Twilio SID/Auth Token, Google Maps API Key) and Firebase service account keys will be provided/configured securely and are not part of the generated code itself.
For the ML part, generating a functional rule-based system is the priority. If ML models are generated, include placeholders for training data loading/simulation.
Focus on core functionality; advanced features like user authentication/profiles/subscriptions can be omitted for the initial build unless specified.
  