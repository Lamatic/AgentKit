// Live smoke test against a deployed Lamatic flow endpoint.
// Usage:
//   1. cp samples/.env.example samples/.env and fill in real values
//   2. node samples/test_flow.js

const fs = require('fs');
const path = require('path');

// ponytail: hand-rolled .env loader (no dotenv dep) since this is a bare
// script with no package.json — a few lines beats adding a dependency.
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  }
}

loadEnv(path.join(__dirname, '.env'));

const API_URL = process.env.LAMATIC_API_URL;
const API_KEY = process.env.LAMATIC_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('LAMATIC_API_URL and LAMATIC_API_KEY must be set (see samples/.env.example)');
}

const depsPath = path.join(__dirname, 'sample_dependency_licenses.json');
const dependency_licenses = fs.readFileSync(depsPath, 'utf8');

async function runTest() {
  console.log('Sending request to Lamatic Flow...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dependency_licenses, allow_list: '' }),
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Workflow execution failed: ${JSON.stringify(data.errors)}`);
  }

  console.log('Flow Execution Successful!');
  console.log('\n--- Output Report ---');
  console.log(data);
}

runTest().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
