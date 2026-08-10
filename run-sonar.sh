#!/bin/bash
set -e

echo "=== System configurations ==="
sudo -n sysctl -w vm.max_map_count=262144 2>/dev/null || sudo sysctl -w vm.max_map_count=262144 2>/dev/null || true

echo "=== Ensuring SonarQube is running clean ==="
docker compose -f docker/sonarqube/docker-compose.yml down -v 2>/dev/null || true
docker compose -f docker/sonarqube/docker-compose.yml up -d

echo "=== Waiting for SonarQube to be ready ==="
IS_UP=false
for i in {1..120}; do
  STATUS=$(curl -s http://localhost:9000/api/system/status | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || true)
  if [ "$STATUS" = "UP" ]; then
    echo "SonarQube server is UP and ready!"
    IS_UP=true
    break
  fi
  echo "Still waiting for SonarQube status UP (current: '${STATUS:-DOWN}')... ($i/120)"
  sleep 5
done

if [ "$IS_UP" != "true" ]; then
  echo "SonarQube failed to reach UP status in time!"
  docker compose -f docker/sonarqube/docker-compose.yml logs --tail=50 sonarqube
  exit 1
fi

echo "=== Checking admin authentication & resetting default password ==="
VALID=$(curl -s -u admin:admin123 http://localhost:9000/api/authentication/validate | grep -o '"valid":true' || true)
if [ -n "$VALID" ]; then
  echo "Authentication with admin123 successful."
else
  echo "Resetting default password admin -> admin123..."
  curl -s -u admin:admin -X POST "http://localhost:9000/api/users/change_password?login=admin&previousPassword=admin&password=admin123" || true
  echo ""
fi

echo "=== Running SonarQube Scanner ==="
docker run --rm \
  --network host \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli:5.0.1

sudo -n rm -rf .scannerwork 2>/dev/null || rm -rf .scannerwork 2>/dev/null || true
