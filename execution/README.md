# Execution Layer

This folder contains deterministic Python scripts that handle specific tasks for the ContableBot Portal development workflow.

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix/macOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Scripts

- `check_api_routes.py` - Validates API route consistency and types
- `analyze_types.py` - Analyzes TypeScript type definitions
- `test_api.py` - Tests API endpoints against local/staging environment

## Philosophy

These scripts are deterministic tools called by the AI orchestration layer. They should:
- Have clear inputs/outputs
- Handle errors gracefully
- Be idempotent where possible
- Log operations for debugging
