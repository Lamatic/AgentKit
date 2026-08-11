"use client";

import { useState } from "react";
import { routes, stops } from "../data/routes";
import { generateIncidentResponse } from "../actions/orchestrate";

type AIResult = {
  priorityLevel?: string;
  recommendedAction?: string;
  estimatedRecoveryTime?: string;
  operationalRecommendation?: string;
  driverInstructions?: string;
  passengerNotification?: string;
  incidentSummary?: string;
};

export default function Home() {
  const [busNumber, setBusNumber] = useState("");
  const [currentRoute, setCurrentRoute] = useState("");
  const [affectedStop, setAffectedStop] = useState("");
  const [incidentType, setIncidentType] = useState("Heavy Traffic");
  const [delay, setDelay] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setResult(null);


    if (
      !busNumber.trim() ||
      !currentRoute.trim() ||
      !affectedStop.trim() ||
      !delay.trim()
    ) {
      setError("Please fill in all incident details.");
      return;
    }

    if (!/^\d+$/.test(busNumber.trim())) {
      setError("Bus Number must contain only numbers.");
      return;
    }



    if (!/^\d+$/.test(delay.trim())) {
      setError("Estimated Delay must be a number in minutes.");
      return;
    }

    const delayNumber = Number(delay.trim());

    if (delayNumber < 0 || delayNumber > 600) {
      setError("Please enter a delay between 0 and 600 minutes.");
      return;
    }

    

    if (!routes.includes(currentRoute)) {
      setError("Please select a valid route.");
      return;
    }

    
    if (!stops.includes(affectedStop)) {
      setError("Please select a valid affected stop.");
      return;
    }

    

    setLoading(true);

try {
  const response = await generateIncidentResponse(
    busNumber.trim(),
    currentRoute.trim(),
    affectedStop.trim(),
    incidentType,
    `${delayNumber} minutes`
  );

  if (!response.success) {
    setError(response.error || "Unable to generate AI response.");
    return;
  }

  setResult(response.data);
}
   catch (error) {
      console.error(error);

      setError(
        "Unable to contact the AI service. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  

  const handleReset = () => {
    setBusNumber("");
    setCurrentRoute("");
    setAffectedStop("");
    setIncidentType("Heavy Traffic");
    setDelay("");

    setResult(null);
    setError("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >
        

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
            }}
          >
            🚌
          </div>

          <h1
            style={{
              fontSize: "2.4rem",
              margin: "10px 0",
              color: "#0f4c81",
            }}
          >
            Transit Incident Manager
          </h1>

          <p
            style={{
              color: "#667085",
              fontSize: "16px",
              margin: 0,
            }}
          >
            AI-powered operational decision support for public transit
            disruptions.
          </p>
        </div>

        

        <section
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "28px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
            border: "1px solid #e4e7ec",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
              }}
            >
              ⚠️
            </span>

            <h2
              style={{
                margin: 0,
                color: "#1d2939",
                fontSize: "1.4rem",
              }}
            >
              Incident Details
            </h2>
          </div>

          

          <label style={labelStyle}>Bus Number</label>

          <input
            type="text"
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
            placeholder="205"
            inputMode="numeric"
            style={inputStyle}
          />

          

          <label style={labelStyle}>Current Route</label>

          <select
            value={currentRoute}
            onChange={(e) => {
  setCurrentRoute(e.target.value);
  setAffectedStop("");
}}
            style={inputStyle}
          >
            <option value="">Select current route</option>

            {routes.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>

          

          <label style={labelStyle}>Affected Stop</label>

          <select
            value={affectedStop}
            onChange={(e) => setAffectedStop(e.target.value)}
            style={{
              ...inputStyle,
              backgroundColor: currentRoute ? "#ffffff" : "#f2f4f7",
              cursor: currentRoute ? "pointer" : "not-allowed",
            }}
            disabled={!currentRoute}
          >
            <option value="">
              {currentRoute
                ? "Select affected stop"
                : "Select a route first"}
            </option>

            {stops.map((stop) => (
              <option key={stop} value={stop}>
                {stop}
              </option>
            ))}
          </select>

          

          <label style={labelStyle}>Incident Type</label>

          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            style={inputStyle}
          >
            <option>Heavy Traffic</option>
            <option>Road Closure</option>
            <option>Vehicle Breakdown</option>
            <option>Accident</option>
            <option>Weather Delay</option>
          </select>

          

          <label style={labelStyle}>
            Estimated Delay (minutes)
          </label>

          <input
            type="text"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            placeholder="25"
            inputMode="numeric"
            style={inputStyle}
          />

          

          {error && (
            <div
              style={{
                marginTop: "5px",
                marginBottom: "15px",
                padding: "13px 15px",
                borderRadius: "8px",
                background: "#fff1f0",
                border: "1px solid #ffa39e",
                color: "#cf1322",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "10px",
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px 20px",
                border: "none",
                borderRadius: "8px",
                background: loading ? "#98a2b3" : "#0f4c81",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "🤖 Generating AI Response..."
                : "🤖 Generate AI Response"}
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                padding: "14px 20px",
                border: "1px solid #d0d5dd",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#344054",
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </section>

        

        {loading && (
          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
              padding: "20px",
              background: "#eef6ff",
              borderRadius: "10px",
              color: "#175cd3",
            }}
          >
            <strong>AI is analyzing the incident...</strong>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: "14px",
              }}
            >
              Generating operational recommendations, driver instructions and
              passenger communication.
            </p>
          </div>
        )}

        

        {result && !loading && (
          <section
            style={{
              marginTop: "35px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h2
                style={{
                  color: "#0f4c81",
                  margin: 0,
                  fontSize: "1.5rem",
                }}
              >
                🤖 AI Incident Analysis
              </h2>

              {result.priorityLevel && (
                <PriorityBadge
                  priority={result.priorityLevel}
                />
              )}
            </div>

            

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <InfoCard
                icon="🚨"
                title="Priority"
                value={
                  result.priorityLevel ||
                  "Not specified"
                }
              />

              <InfoCard
                icon="⚡"
                title="Recommended Action"
                value={
                  result.recommendedAction ||
                  "Not specified"
                }
              />

              <InfoCard
                icon="⏱️"
                title="Recovery Estimate"
                value={
                  result.estimatedRecoveryTime ||
                  "Not specified"
                }
              />
            </div>

            

            <ResponseCard
              color="#eaf4ff"
              borderColor="#91caff"
              title="🚍 Operational Recommendation"
              text={
                result.operationalRecommendation ||
                "No recommendation available."
              }
            />


            <ResponseCard
              color="#fff8e6"
              borderColor="#ffd666"
              title="👨‍✈️ Driver Instructions"
              text={
                result.driverInstructions ||
                "No driver instructions available."
              }
            />


            <ResponseCard
              color="#edfff0"
              borderColor="#95de64"
              title="📢 Passenger Notification"
              text={
                result.passengerNotification ||
                "No passenger notification available."
              }
            />

            

            <ResponseCard
              color="#f7efff"
              borderColor="#d3adf7"
              title="📋 Incident Summary"
              text={
                result.incidentSummary ||
                "No incident summary available."
              }
            />
          </section>
        )}
      </div>
    </main>
  );
}



const labelStyle = {
  display: "block",
  fontWeight: "600",
  color: "#344054",
  fontSize: "14px",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "20px",
  borderRadius: "8px",
  border: "1px solid #d0d5dd",
  fontSize: "15px",
  boxSizing: "border-box" as const,
  outline: "none",
  backgroundColor: "#ffffff",
};



function InfoCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e4e7ec",
        borderRadius: "10px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: "22px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "#667085",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#1d2939",
        }}
      >
        {value}
      </div>
    </div>
  );
}



function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const normalizedPriority =
    priority.toLowerCase();

  let background = "#e4e7ec";
  let color = "#344054";

  if (normalizedPriority.includes("high")) {
    background = "#ffe4e6";
    color = "#c01048";
  } else if (
    normalizedPriority.includes("medium")
  ) {
    background = "#fff1cc";
    color = "#b54708";
  } else if (
    normalizedPriority.includes("low")
  ) {
    background = "#dcfae6";
    color = "#027a48";
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "8px 15px",
        borderRadius: "20px",
        background,
        color,
        fontWeight: "700",
        fontSize: "14px",
      }}
    >
      <span>Priority:</span>

      {priority}
    </div>
  );
}



function ResponseCard({
  title,
  text,
  color,
  borderColor,
}: {
  title: string;
  text: string;
  color: string;
  borderColor: string;
}) {
  return (
    <div
      style={{
        background: color,
        border: `1px solid ${borderColor}`,
        borderRadius: "10px",
        padding: "20px",
        marginTop: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "10px",
          color: "#1d2939",
          fontSize: "17px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          lineHeight: "1.7",
          color: "#475467",
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}