#!/usr/bin/env bash
set -euo pipefail

bold() { printf '\033[1m%s\033[0m\n' "$*"; }

bold "1) Listing running containers"
docker compose -f compose.devops.yml ps

bold "2) API health via gateway (mkcert TLS)"
curl -sk --resolve app.test:443:127.0.0.1 https://app.test/api/health

bold "3) Debug IP endpoint"
curl -sk --resolve app.test:443:127.0.0.1 https://app.test/debug_ip

bold "4) Prometheus targets"
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets'

bold "5) Grafana dashboard URL"
echo "http://localhost:3001/d/fake-twitter-overview/fake-twitter-overview"

bold "6) Sending test log to Graylog"
echo "<14>1 $(date -u +"%Y-%m-%dT%H:%M:%S.000Z") demo fake-twitter demo - - Demo syslog" | nc -u -w1 127.0.0.1 5140
