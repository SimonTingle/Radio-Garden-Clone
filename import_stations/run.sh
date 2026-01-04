#!/bin/bash

# Stop the script immediately if any command fails (Zero hallucinations/safety)
set -e

# Define the virtual environment directory name
VENV_DIR="venv"

echo "--- Starting Setup ---"

# 1. Create Virtual Environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment in ./$VENV_DIR..."
    python3 -m venv "$VENV_DIR"
else
    echo "Virtual environment already exists."
fi

# 2. Activate the Virtual Environment
# This allows us to use the 'python' and 'pip' inside the venv folder
source "$VENV_DIR/bin/activate"

# 3. Install Dependencies
echo "Checking and installing dependencies..."
# Upgrading pip is good practice to avoid warning messages
pip install --upgrade pip > /dev/null
# Install requests (quietly to reduce noise, remove -q to see details)
pip install requests

# 4. Run the Python script
echo "--- Running Importer ---"
python import_stations.py

echo "--- Process Complete ---"
