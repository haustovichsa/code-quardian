#!/bin/bash

# Run 100 scan requests to the API
for i in {1..100}
do
  echo "Starting scan #$i..."
  curl -X POST http://localhost:3000/api/scan \
    -H "Content-Type: application/json" \
    -d '{"repositoryUrl": "https://github.com/haustovichsa/NodeGoat"}'
  echo ""
  echo "Scan #$i request sent"
  echo "---"
done

echo "All 100 scan requests completed!"
