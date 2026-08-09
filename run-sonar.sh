#!/bin/bash
set -e

echo "=== System configurations ==="
sudo -n sysctl -w vm.max_map_count=262144 2>/dev/null || true

echo "=== Ensuring SonarQube is running ==="
docker compose -f docker/sonarqube/docker-compose.yml up -d

echo "=== Waiting for SonarQube to be ready ==="
for i in {1..50}; do
  if curl -s -I http://localhost:9000 | grep -E "HTTP/1.1 200|HTTP/1.1 302|HTTP/1.1 307|HTTP/2 200|HTTP/2 302|HTTP/2 307" >/dev/null; then
    echo "SonarQube web server is responding!"
    sleep 10 # Give it a little more time to initialize database and plugins
    break
  fi
  echo "Still waiting for SonarQube on port 9000... ($i/50)"
  sleep 5
done

echo "=== Checking admin authentication & resetting default password ==="
# Try to query status with new password
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u admin:admin123 http://localhost:9000/api/system/status || true)
if [ "$STATUS_CODE" = "200" ]; then
  echo "Authentication with admin123 successful."
else
  echo "Resetting default password admin -> admin123..."
  curl -s -u admin:admin -X POST "http://localhost:9000/api/users/change_password?login=admin&previousPassword=admin&password=admin123" || echo "Password change request completed."
fi

echo "=== Running SonarQube Scanner ==="
docker run --rm \
  --network host \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli:latest
