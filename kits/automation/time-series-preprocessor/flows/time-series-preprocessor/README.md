# Time-Series Preprocessor Flow

## About This Flow

This flow automates time-series data preprocessing by analyzing a dataset schema and generating production-ready Python code. It consists of 3 nodes working together to receive, process, and return a complete preprocessing pipeline.

## Flow Components

This workflow includes the following node types:
- **API Request** — Receives the dataset summary as a JSON string input
- **Generate Text** — Analyzes the schema using Gemini and generates a Python script
- **API Response** — Returns the generated preprocessing script to the caller

## Configuration Requirements

This flow requires configuration for 1 node with private inputs:
- **Generate Text node** — Requires a Google Gemini API key configured in Lamatic Studio credentials

All required configurations are documented in the `inputs.json` file.

## Files Included

- `config.json` — Complete flow structure with nodes and connections
- `inputs.json` — Private inputs requiring configuration
- `meta.json` — Flow metadata and information

## Input

| Variable | Type | Description |
|---|---|---|
| `dataset_summary` | string | JSON summary of the dataset including column names, types, and missing value percentages |

## Output

| Variable | Type | Description |
|---|---|---|
| `result` | object | Contains the generated Python preprocessing script |

## Example Input

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

```python
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.set_index('timestamp').sort_index()
df['temperature'].fillna(method='ffill', inplace=True)
df['pressure'].fillna(df['pressure'].mean(), inplace=True)
scaler = MinMaxScaler()
df[['temperature', 'pressure']] = scaler.fit_transform(df[['temperature', 'pressure']])
```

## Use Cases

- Automating preprocessing for IoT sensor data
- Preparing time-series data for LSTM or Transformer models
- Standardizing data pipelines across multiple projects
- Replacing manual, repetitive preprocessing scripts

## Next Steps — Share with the Community

This flow is contributed to the Lamatic AgentKit ecosystem.
Visit [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit) to explore more flows.

## Support

- Review node documentation for specific integrations
- Check Lamatic documentation at [docs.lamatic.ai](https://docs.lamatic.ai)
- Contact support for assistance
- 