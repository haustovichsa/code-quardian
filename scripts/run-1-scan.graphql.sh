#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
GRAPHQL_URL="http://localhost:4000/graphql"
REPOSITORY_URL="${1:-https://github.com/haustovichsa/NodeGoat}"

echo -e "${YELLOW}Testing Code Guardian GraphQL Flow${NC}"
echo "Repository: $REPOSITORY_URL"
echo ""

# Step 1: Create scan using GraphQL mutation
echo -e "${YELLOW}Step 1: Creating scan...${NC}"

# GraphQL mutation with variables
MUTATION='mutation CreateScan($input: CreateScanInput!) {
  createScan(input: $input) {
    id
    repositoryUrl
    status
    createdAt
  }
}'

# Prepare GraphQL request payload
REQUEST_PAYLOAD=$(cat <<EOF
{
  "query": $(echo "$MUTATION" | jq -Rs .),
  "variables": {
    "input": {
      "repositoryUrl": "$REPOSITORY_URL"
    }
  }
}
EOF
)

RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_PAYLOAD")

# Check if curl failed
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create scan${NC}"
  exit 1
fi

# Check for GraphQL errors
GRAPHQL_ERROR=$(echo "$RESPONSE" | grep -o '"errors":\[' | head -1)
if [ -n "$GRAPHQL_ERROR" ]; then
  echo -e "${RED}GraphQL error occurred${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

# Extract scanId from nested GraphQL response (data.createScan.id)
SCAN_ID=$(echo "$RESPONSE" | jq -r '.data.createScan.id // empty')

if [ -z "$SCAN_ID" ]; then
  echo -e "${RED}Failed to extract scan ID from response${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo -e "${GREEN}Scan created successfully!${NC}"
echo "Scan ID: $SCAN_ID"
echo ""

# Step 2: Poll scan status using GraphQL query
echo -e "${YELLOW}Step 2: Polling scan status...${NC}"
echo ""

# GraphQL query for getting scan details
QUERY='query GetScan($id: ID!) {
  scan(id: $id) {
    id
    repositoryUrl
    status
    error
    startedAt
    finishedAt
    vulnerabilities {
      VulnerabilityID
      PkgName
      InstalledVersion
      FixedVersion
      Title
      Description
      Severity
    }
    createdAt
    updatedAt
  }
}'

STATUS="Queued"
COUNTER=0

while [ "$STATUS" != "Finished" ] && [ "$STATUS" != "Failed" ]; do
  COUNTER=$((COUNTER + 1))

  # Prepare GraphQL query payload
  QUERY_PAYLOAD=$(cat <<EOF
{
  "query": $(echo "$QUERY" | jq -Rs .),
  "variables": {
    "id": "$SCAN_ID"
  }
}
EOF
)

  # Get scan status via GraphQL
  STATUS_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d "$QUERY_PAYLOAD")

  # Extract status from nested response (data.scan.status)
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.scan.status // empty')

  # Safety check: break if status extraction fails multiple times
  if [ -z "$STATUS" ]; then
    if [ $COUNTER -gt 5 ]; then
      echo -e "${RED}Failed to extract status after multiple attempts${NC}"
      echo "Last response: $STATUS_RESPONSE"
      exit 1
    fi
  fi

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

  # Wait 0.5 seconds before next poll
  sleep 0.5
done

echo ""
if [ "$STATUS" = "Finished" ]; then
  echo -e "${GREEN}✓ Scan completed successfully!${NC}"
elif [ "$STATUS" = "Failed" ]; then
  ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.data.scan.error // "Unknown error"')
  echo -e "${RED}✗ Scan failed!${NC}"
  echo "Error: $ERROR"
fi
