# Time-Series Preprocessor — Lamatic AgentKit

An automation kit that analyzes time-series dataset schemas and generates production-ready Python preprocessing pipelines using `pandas` and `scikit-learn`. Paste a JSON summary of your dataset and receive executable code in seconds.

---

## What It Does

By providing a JSON summary of your dataset, the agent generates a complete Python script that handles:

- **Missing value imputation** — forward-fill, mean, and median strategies selected based on column type
- **Feature scaling** — MinMaxScaler or StandardScaler applied appropriately
- **Datetime parsing and index management** — automatic timestamp detection and alignment
- **Categorical encoding** — label or one-hot encoding based on cardinality
- **Standardized implementation** — clean, readable `pandas` + `scikit-learn` code ready to run

---

## Project Background

This kit was developed to solve the repetitive nature of data cleaning in time-series projects.

The concept originated during the development of a **water demand forecasting model** for a college located in a rural area near Bhopal. Due to aging sensor hardware and inconsistent data streams, significant time was spent manually handling missing values and aligning disparate data sources — rainfall readings, local water levels, and consumption logs from different systems with mismatched timestamps.

The goal was to automate the boilerplate preprocessing code, allowing engineers to focus on model performance rather than manual cleanup. This kit is the result of that experience.

---

## Who Is It For

Data engineers and machine learning engineers who frequently work with time-series data and need a fast way to generate reliable, repeatable preprocessing pipelines without writing boilerplate code from scratch.

---

## Tech Stack

| Tool | Role |
|---|---|
| [Lamatic.ai](https://lamatic.ai) | Flow orchestration and Edge deployment |
| Gemini 2.5 Pro | AI-driven Python code generation |
| Next.js 14 | Interactive frontend sandbox |
| pandas + scikit-learn | Target libraries for generated pipelines |

---

## Setup

### 1. Build and Deploy Flow in Lamatic Studio

1. Sign in at [lamatic.ai](https://lamatic.ai)
2. Create a new project (if you don't have one)
3. Click **+ New Flow** and select **API Request** as the trigger
4. Add a **Generate Text** node and select **Gemini 2.5 Pro**
5. Set the input variable to `dataset_summary`
6. Configure the system prompt to act as an expert data engineer
7. Deploy the flow and copy your credentials from the Studio dashboard

### 2. Environment Variables

Create a `.env.local` file in the kit root directory:

```env
TIME_SERIES_PREPROCESSOR="Your Flow ID from Lamatic Studio"
LAMATIC_API_URL="Your API Endpoint URL"
LAMATIC_PROJECT_ID="Your Project ID"
LAMATIC_API_KEY="Your API Key"
```

| Variable | Where to Find It |
|---|---|
| `TIME_SERIES_PREPROCESSOR` | Studio → Your Flow → Settings |
| `LAMATIC_API_URL` | Studio → Your Flow → API Endpoint |
| `LAMATIC_PROJECT_ID` | Studio → Project Settings |
| `LAMATIC_API_KEY` | Studio → Project Settings → API Keys |

### 3. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the frontend interface.

---

## Example Input

Provide a JSON object describing your dataset structure:

```json
{
  "dataset_name": "sensor_readings",
  "frequency": "1min",
  "columns": [
    {"name": "timestamp", "type": "datetime"},
    {"name": "temperature", "type": "float", "missing_pct": 5},
    {"name": "pressure", "type": "float", "missing_pct": 2},
    {"name": "status", "type": "categorical", "missing_pct": 0}
  ],
  "rows": 50000,
  "target_column": "temperature"
}
```

## Example Output

The agent returns a fully executable Python script:

```python
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# Load and index
df = pd.read_csv("sensor_readings.csv", parse_dates=["timestamp"])
df.set_index("timestamp", inplace=True)

# Impute missing values
df["temperature"].fillna(method="ffill", inplace=True)
df["pressure"].fillna(df["pressure"].mean(), inplace=True)

# Scale numerical features
scaler = MinMaxScaler()
df[["temperature", "pressure"]] = scaler.fit_transform(df[["temperature", "pressure"]])

print("Preprocessing complete.")
print(df.head())
```

---

## Project Structure

```
time-series-preprocessor/
├── actions/
│   └── orchestrate.ts       # Server action calling the Lamatic flow
├── app/
│   └── page.tsx             # Main UI — input form and output display
├── components/
│   └── ui/                  # shadcn/ui components
├── flows/
│   └── time-series-preprocessor/
│       ├── config.json      # Exported Lamatic flow graph
│       ├── inputs.json      # Input schema definition
│       └── meta.json        # Flow metadata
├── lib/
│   └── lamatic-client.ts    # Lamatic SDK client
├── .env.example             # Environment variable template
├── config.json              # Kit metadata
└── README.md
```

---

## Contributing

Contributions are welcome. Open an issue or pull request in the [AgentKit repository](https://github.com/Lamatic/AgentKit).

## License

MIT License — see [LICENSE](../../../../LICENSE).