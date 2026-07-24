// Code: Data Quality Format
// Flow: data-quality-agent

output = {
  report: "{{ analyze_quality.output }}",
  status: "success",
  timestamp: new Date().toISOString()
};
