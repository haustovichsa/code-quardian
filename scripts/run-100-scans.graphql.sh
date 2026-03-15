#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
GRAPHQL_URL="http://localhost:4000/graphql"
REPO_URL="https://github.com/haustovichsa/NodeGoat"
POLL_INTERVAL=2

# Storage arrays (parallel arrays - scan_ids[i] maps to scan_statuses[i])
declare -a scan_ids=()
declare -a scan_statuses=()

# GraphQL mutation for creating scans
CREATE_SCAN_MUTATION='mutation CreateScan($input: CreateScanInput!) {
  createScan(input: $input) {
    id
    repositoryUrl
    status
    createdAt
  }
}'

# GraphQL query for getting scan status
GET_SCAN_QUERY='query GetScan($id: ID!) {
  scan(id: $id) {
    id
    status
  }
}'

# Phase 1: Create all scans
echo -e "${YELLOW}Creating 100 scans using GraphQL...${NC}"

for i in {1..100}; do
  # Prepare GraphQL request payload
  request_payload=$(cat <<EOF
{
  "query": $(echo "$CREATE_SCAN_MUTATION" | jq -Rs .),
  "variables": {
    "input": {
      "repositoryUrl": "$REPO_URL"
    }
  }
}
EOF
)

  response=$(curl -s -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d "$request_payload")

  # Check for GraphQL errors
  graphql_error=$(echo "$response" | grep -o '"errors":\[' | head -1)
  if [ -n "$graphql_error" ]; then
    echo -e "\n${RED}GraphQL error occurred during scan creation${NC}"
    echo "Response: $response"
    continue
  fi

  # Extract scan ID from nested response (data.createScan.id)
  scan_id=$(echo "$response" | jq -r '.data.createScan.id // empty')

  if [ -n "$scan_id" ]; then
    scan_ids+=("$scan_id")
    scan_statuses+=("Queued")
  fi

  # Show inline progress
  printf "\rCreating scans: %d/100" "$i"
done

echo ""
echo -e "${GREEN}All scans created. Starting monitoring...${NC}"
echo ""

# Phase 2: Poll scan statuses
while true; do
  # Parallel status fetching (limit concurrency to 20)
  rm -f /tmp/poll_results_$$.txt

  # Fetch statuses for all scans
  for idx in "${!scan_ids[@]}"; do
    scan_id="${scan_ids[$idx]}"

    # Skip if already in terminal state
    current_status="${scan_statuses[$idx]}"
    if [ "$current_status" = "Finished" ] || [ "$current_status" = "Failed" ]; then
      continue
    fi

    (
      # Prepare GraphQL query payload
      query_payload=$(cat <<EOF
{
  "query": $(echo "$GET_SCAN_QUERY" | jq -Rs .),
  "variables": {
    "id": "$scan_id"
  }
}
EOF
)

      status_response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "$query_payload" 2>/dev/null)

      # Extract status from nested response (data.scan.status)
      status=$(echo "$status_response" | jq -r '.data.scan.status // empty')
      echo "$idx|$status" >> /tmp/poll_results_$$.txt
    ) &

    # Limit to 20 concurrent requests (bash 3.2 compatible)
    if (( $(jobs -r | wc -l) >= 20 )); then
      wait
    fi
  done
  wait

  # Update status tracking
  if [ -f /tmp/poll_results_$$.txt ]; then
    while IFS='|' read -r idx status; do
      if [ -n "$status" ]; then
        scan_statuses[$idx]="$status"
      fi
    done < /tmp/poll_results_$$.txt
  fi

  # Count by status
  queued=0
  scanning=0
  finished=0
  failed=0

  for status in "${scan_statuses[@]}"; do
    case "$status" in
      "Queued") queued=$((queued + 1)) ;;
      "Scanning") scanning=$((scanning + 1)) ;;
      "Finished") finished=$((finished + 1)) ;;
      "Failed") failed=$((failed + 1)) ;;
    esac
  done

  # Calculate progress
  terminal=$((finished + failed))
  total=${#scan_ids[@]}

  if [ "$total" -gt 0 ]; then
    progress=$((terminal * 100 / total))
  else
    progress=0
  fi

  # Display single-line status with timestamp
  timestamp=$(date +"%H:%M:%S")
  printf "\r\033[K[$timestamp] Queued: %d | Scanning: %d | Finished: %d | Failed: %d | Progress: %d%%" \
    "$queued" "$scanning" "$finished" "$failed" "$progress"

  # Check if all scans are complete
  if [ "$terminal" -eq "$total" ] && [ "$total" -gt 0 ]; then
    break
  fi

  sleep "$POLL_INTERVAL"
done

# Cleanup
rm -f /tmp/poll_results_$$.txt

# Phase 3: Final summary
echo ""
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All scans completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Total scans:      ${CYAN}${#scan_ids[@]}${NC}"
echo -e "Finished:         ${GREEN}$finished${NC}"
echo -e "Failed:           ${RED}$failed${NC}"

if [ "${#scan_ids[@]}" -gt 0 ]; then
  success_rate=$((finished * 100 / ${#scan_ids[@]}))
  echo -e "Success rate:     ${CYAN}${success_rate}%${NC}"
fi
