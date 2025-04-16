"use client";

import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { summarizeSensorData, SummarizeSensorDataInput, SummarizeSensorDataOutput } from '@/ai/flows/summarize-sensor-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { intelligentFloodRiskAssessment, IntelligentFloodRiskAssessmentInput, IntelligentFloodRiskAssessmentOutput } from '@/ai/flows/intelligent-flood-risk-assessment';

const mapStyles = {
  width: '100%',
  height: '600px',
};

const defaultLocation = {
  latitude: 21.1458,
  longitude: 79.0882,
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Mock sensor data
const mockSensorData = [
  {
    deviceId: "node_001",
    location: { latitude: 21.1458, longitude: 79.0882 },
    latest_reading: {
      timestamp: Date.now(),
      waterLevelCm: 65,
      rainDetected: true,
      turbidityNtu: 50,
      temperatureC: 28,
      humidityPercent: 70,
      pressureHpa: 1012,
    },
  },
  {
    deviceId: "node_002",
    location: { latitude: 21.1558, longitude: 79.1082 },
    latest_reading: {
      timestamp: Date.now(),
      waterLevelCm: 30,
      rainDetected: false,
      turbidityNtu: 25,
      temperatureC: 30,
      humidityPercent: 65,
      pressureHpa: 1013,
    },
  },
  {
    deviceId: "node_003",
    location: { latitude: 21.1358, longitude: 79.0782 },
    latest_reading: {
      timestamp: Date.now(),
      waterLevelCm: 90,
      rainDetected: true,
      turbidityNtu: 80,
      temperatureC: 26,
      humidityPercent: 75,
      pressureHpa: 1011,
    },
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Normal":
      return "green";
    case "Watch":
      return "yellow";
    case "Warning":
      return "orange";
    case "Predicted_Flood":
      return "red";
    case "Error":
      return "gray";
    default:
      return "gray";
  }
};

export default function Home() {
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [sensorSummaries, setSensorSummaries] = useState<Record<string, SummarizeSensorDataOutput>>({});
    const [floodRiskStatuses, setFloodRiskStatuses] = useState<Record<string, IntelligentFloodRiskAssessmentOutput>>({});
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    async function summarizeData() {
      const summaries: Record<string, SummarizeSensorDataOutput> = {};
        const floodRisks: Record<string, IntelligentFloodRiskAssessmentOutput> = {};

      for (const sensor of mockSensorData) {
        const input: SummarizeSensorDataInput = {
          deviceId: sensor.deviceId,
          waterLevel_cm: sensor.latest_reading.waterLevelCm,
          rainDetected: sensor.latest_reading.rainDetected,
          turbidity_ntu: sensor.latest_reading.turbidityNtu,
          temperature_c: sensor.latest_reading.temperatureC,
          humidity_percent: sensor.latest_reading.humidityPercent,
          pressure_hpa: sensor.latest_reading.pressureHpa,
          location: sensor.location,
        };

          const floodRiskInput: IntelligentFloodRiskAssessmentInput = {
              deviceId: sensor.deviceId,
              waterLevelCm: sensor.latest_reading.waterLevelCm,
              rainDetected: sensor.latest_reading.rainDetected,
              turbidityNtu: sensor.latest_reading.turbidityNtu,
              temperatureC: sensor.latest_reading.temperatureC,
              humidityPercent: sensor.latest_reading.humidityPercent,
              pressureHpa: sensor.latest_reading.pressureHpa,
              location: sensor.location,
          };
        try {
          const summary = await summarizeSensorData(input);
            const riskAssessment = await intelligentFloodRiskAssessment(floodRiskInput);
          summaries[sensor.deviceId] = summary;
            floodRisks[sensor.deviceId] = riskAssessment;
        } catch (error: any) {
          console.error("Error summarizing sensor data:", error);
          summaries[sensor.deviceId] = {
            summary: "Error summarizing data",
            status: "Error",
          };
            floodRisks[sensor.deviceId] = {
                status: "Error",
                predictedFloodRisk: 1,
                alertMessage: "Error assessing flood risk",
            };
        }
      }
      setSensorSummaries(summaries);
        setFloodRiskStatuses(floodRisks);
    }

    summarizeData();
  }, []);

  const handleMarkerClick = (sensor: any) => {
    setSelectedSensor(sensor);
  };

  const handleCloseInfoWindow = () => {
    setSelectedSensor(null);
  };

  const addAlert = (message: string) => {
    setAlerts((prevAlerts) => [...prevAlerts, message]);
  };

  useEffect(() => {
      if (selectedSensor && floodRiskStatuses[selectedSensor.deviceId]?.status !== "Normal") {
          const alertMessage = `[${selectedSensor.deviceId}]: ${floodRiskStatuses[selectedSensor.deviceId]?.alertMessage}`;
      addAlert(alertMessage);
      // clear alerts after 5 seconds
      setTimeout(() => {
        setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert !== alertMessage));
      }, 5000);
    }
  }, [selectedSensor, floodRiskStatuses]);

  return (
    
      
        {alerts.length > 0 && (
          <>
            {alerts.map((alert, index) => (
              
                <AlertTitle>Alert!</AlertTitle>
                <AlertDescription>{alert}</AlertDescription>
              
            ))}
          </>
        )}
        {apiKey ? (
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={mapStyles}
              center={defaultLocation}
              zoom={12}
            >
              {mockSensorData.map((sensor, index) => {
                  const status = floodRiskStatuses[sensor.deviceId]?.status || "Normal";
                const color = getStatusColor(status);
                return (
                  <Marker
                    key={index}
                    position={sensor.location}
                    onClick={() => handleMarkerClick(sensor)}
                    icon={{
                      path: "M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 29.2 46.5 29.2 46.5s29.2-31 29.2-46.5c0-9.6-7.9-17.4-17.7-17.4z",
                      fillColor: color,
                      fillOpacity: 0.8,
                      strokeColor: "black",
                      strokeWeight: 1,
                    }}
                  />
                );
              })}

              {selectedSensor && (
                <InfoWindow
                  position={selectedSensor.location}
                  onCloseClick={handleCloseInfoWindow}
                >
                  
                    <h3>{selectedSensor.deviceId}</h3>
                    <p>Water Level: {selectedSensor.latest_reading.waterLevelCm} cm</p>
                    <p>Rain: {selectedSensor.latest_reading.rainDetected ? "Yes" : "No"}</p>
                    <p>Turbidity: {selectedSensor.latest_reading.turbidityNtu} NTU</p>
                    {sensorSummaries[selectedSensor.deviceId] && (
                      <>
                        <Badge variant="secondary">{floodRiskStatuses[selectedSensor.deviceId].status}</Badge>
                        <p>{sensorSummaries[selectedSensor.deviceId].summary}</p>
                      </>
                    )}
                  
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        ) : (
          
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Please set the <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> environment variable to display the map.
            </AlertDescription>
          
        )}
      
    
  );
}
