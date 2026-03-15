#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000/api/scan"
REPOSITORY_URL="${1:-https://github.com/haustovichsa/NodeGoat}"

echo -e "${YELLOW}Testing Code Guardian API Flow${NC}"
echo "Repository: $REPOSITORY_URL"
echo ""

# Step 1: Create scan
echo -e "${YELLOW}Step 1: Creating scan...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"repositoryUrl\": \"$REPOSITORY_URL\"}")

# Check if curl failed
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create scan${NC}"
  exit 1
fi

# Extract scanId from response
SCAN_ID=$(echo "$RESPONSE" | grep -o '"scanId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SCAN_ID" ]; then
  echo -e "${RED}Failed to extract scan ID from response${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo -e "${GREEN}Scan created successfully!${NC}"
echo "Scan ID: $SCAN_ID"
echo ""

# Step 2: Poll scan status
echo -e "${YELLOW}Step 2: Polling scan status...${NC}"
echo ""

STATUS="Queued"
COUNTER=0

while [ "$STATUS" != "Finished" ] && [ "$STATUS" != "Failed" ]; do
  COUNTER=$((COUNTER + 1))

  # Get scan status
  STATUS_RESPONSE=$(curl -s "$API_URL/$SCAN_ID")

  # Extract status
  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  # Display status with timestamp
  TIMESTAMP=$(date +"%H:%M:%S")
  echo -e "[$TIMESTAMP] Poll #$COUNTER - Status: ${YELLOW}$STATUS${NC}"

  # If finished or failed, show final details
  if [ "$STATUS" = "Finished" ] || [ "$STATUS" = "Failed" ]; then
    echo ""
    echo -e "${GREEN}Final Response:${NC}"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    break
  fi

  # Wait 1 second before next poll
  sleep 0.5
done

echo ""
if [ "$STATUS" = "Finished" ]; then
  echo -e "${GREEN}✓ Scan completed successfully!${NC}"
elif [ "$STATUS" = "Failed" ]; then
  ERROR=$(echo "$STATUS_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo -e "${RED}✗ Scan failed!${NC}"
  echo "Error: $ERROR"
fi
