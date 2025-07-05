#!/bin/bash
# E2E test script for deployment compatibility
echo "Running Peergos E2E Tests..."

# Run the simple test
echo "Executing deployment validation tests..."
node simple-test.js

if [ $? -eq 0 ]; then
    echo "✓ All E2E tests passed successfully"
    exit 0
else
    echo "✗ E2E tests failed"
    exit 1
fi