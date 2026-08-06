import json
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

API_URL = os.getenv("LAMATIC_API_URL")
API_KEY = os.getenv("LAMATIC_API_KEY")

if not API_URL or not API_KEY:
    raise ValueError("LAMATIC_API_URL and LAMATIC_API_KEY must be set in .env")

# 1. Load schemas dynamically from local files instead of hardcoding JSON strings
base_dir = os.path.dirname(os.path.abspath(__file__))

v1_path = os.path.join(base_dir, "v1_schema.json")
v2_path = os.path.join(base_dir, "v2_schema.json")

with open(v1_path, "r", encoding="utf-8") as f:
    v1_schema = json.load(f)

with open(v2_path, "r", encoding="utf-8") as f:
    v2_schema = json.load(f)

payload = {
    "v1_schema": v1_schema,
    "v2_schema": v2_schema
}

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def run_test():
    print("Sending request to Lamatic Flow...")
    
    # 2. Add timeout parameter (connect timeout: 10s, read timeout: 60s)
    response = requests.post(API_URL, json=payload, headers=headers, timeout=(10, 60))
    
    # 3. Throw HTTP error exception if status code is not 200 OK
    response.raise_for_status()
    
    res_data = response.json()
    
    # Handle GraphQL / Lamatic workflow response errors cleanly
    if "errors" in res_data:
        raise RuntimeError(f"Workflow execution failed with errors: {res_data['errors']}")
        
    print("Flow Execution Successful!")
    print("\n--- Output Report ---")
    print(res_data)

if __name__ == "__main__":
    run_test()