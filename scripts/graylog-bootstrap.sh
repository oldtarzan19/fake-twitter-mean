#!/usr/bin/env bash
set -euo pipefail

GRAYLOG_URL=${GRAYLOG_URL:-http://localhost:9000/api}
GRAYLOG_USER=${GRAYLOG_USER:-admin}
GRAYLOG_PASSWORD=${GRAYLOG_PASSWORD:-admin}

payload=$(
  cat <<'JSON'
{
  "title": "Syslog UDP 5140",
  "type": "org.graylog2.inputs.syslog.udp.SyslogUDPInput",
  "global": true,
  "configuration": {
    "port": 5140,
    "bind_address": "0.0.0.0",
    "recv_buffer_size": 262144,
    "number_worker_threads": 2,
    "override_source": null,
    "allow_override_date": false,
    "store_full_message": false
  }
}
JSON
)

curl -u "${GRAYLOG_USER}:${GRAYLOG_PASSWORD}" \
  -H 'X-Requested-By: devops' \
  -H 'Content-Type: application/json' \
  -X POST "${GRAYLOG_URL}/system/inputs" \
  -d "${payload}"
