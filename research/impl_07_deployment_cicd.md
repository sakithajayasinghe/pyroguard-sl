# IMPLEMENTATION RESEARCH: Nginx Reverse Proxy + Let's Encrypt SSL + GitHub Actions CI/CD

This document details the exact configuration and steps required to deploy a FastAPI backend and a Vite frontend (React/Vue) on an Ubuntu 24.04 server using Nginx, Let's Encrypt, and a self-hosted GitHub Actions runner.

---

## 1. Nginx Configuration

We will serve the Vite static build at `/` and proxy API requests to FastAPI at `/api/`. We'll also include WebSocket support, gzip compression, and security headers.

**File:** `/etc/nginx/sites-available/calit_online`

```nginx
server {
    listen 80;
    server_name calit.online www.calit.online;

    # Redirect all HTTP to HTTPS (Will be automatically added by Certbot, but good to know)
    # return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name calit.online www.calit.online;

    # SSL Certificates (managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/calit.online/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/calit.online/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 256;

    # Serve Vite Frontend (Static Files)
    location / {
        root /var/www/calit_online/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to FastAPI
    location /api/ {
        # Optional: rewrite to strip /api if FastAPI doesn't expect it
        # rewrite ^/api/(.*)$ /$1 break;
        
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
*Symlink this file to enable it:* `sudo ln -s /etc/nginx/sites-available/calit_online /etc/nginx/sites-enabled/` and `sudo nginx -t && sudo systemctl reload nginx`.

---

## 2. Let's Encrypt SSL (Certbot) Setup

On Ubuntu 24.04, it is highly recommended to use the snap version of Certbot.

### Installation & Execution
```bash
# 1. Install snapd (usually pre-installed on 24.04)
sudo apt update
sudo apt install snapd

# 2. Ensure latest snap core
sudo snap install core; sudo snap refresh core

# 3. Install Certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# 4. Run Certbot for Nginx
sudo certbot --nginx -d calit.online -d www.calit.online
```

### Auto-Renewal
Certbot automatically installs a systemd timer for renewals. You can verify it works via:
```bash
sudo certbot renew --dry-run
```

### What if DNS hasn't propagated yet?
Certbot HTTP-01 challenge requires DNS to be pointing to your server's IP. If it hasn't propagated, Certbot will fail.
**Workaround:** Wait for propagation (can check with `dig calit.online`), or use DNS-01 challenge (requires API access to your DNS provider) which doesn't rely on A-record propagation in the same way. Otherwise, skip the `certbot` step until DNS resolves.

---

## 3. GitHub Actions CI/CD for Self-Hosted Runner

This workflow automates the deployment when code is pushed to `main`. It builds the Vite app, installs Python dependencies, and restarts the FastAPI service.

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: self-hosted
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Build Frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
          # Copy to Nginx serve directory
          sudo rsync -av --delete dist/ /var/www/calit_online/frontend/dist/

      - name: Setup Backend Environment
        working-directory: ./backend
        run: |
          python3 -m venv venv
          source venv/bin/activate
          pip install -r requirements.txt
          
          # Copy backend files to the deployment directory
          sudo rsync -av --delete ./ /var/www/calit_online/backend/
          
      - name: Restart FastAPI Service
        run: |
          sudo systemctl restart fastapi-app
          
      - name: Health Check
        run: |
          sleep 5
          curl -f http://127.0.0.1:8000/api/health || exit 1
```

---

## 4. Systemd Service for FastAPI

Using `systemd` ensures FastAPI stays alive, starts on boot, and restarts on failure.

**File:** `/etc/systemd/system/fastapi-app.service`

```ini
[Unit]
Description=FastAPI Uvicorn/Gunicorn Service
After=network.target

[Service]
User=github-runner
Group=www-data
WorkingDirectory=/var/www/calit_online/backend

# Load environment variables
EnvironmentFile=/var/www/calit_online/backend/.env

# Using Gunicorn with Uvicorn workers is recommended for production
ExecStart=/var/www/calit_online/backend/venv/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000

# Auto-restart on failure
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

*To activate:*
```bash
sudo systemctl daemon-reload
sudo systemctl start fastapi-app
sudo systemctl enable fastapi-app
```

---

## 5. Alternative: Docker Compose Deployment

If you prefer containerization over systemd.

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: fastapi_backend
    restart: always
    env_file: .env
    expose:
      - "8000"

  nginx:
    image: nginx:alpine
    container_name: nginx_proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./frontend/dist:/var/www/frontend
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
```
*GitHub Actions step would simplify to:* `docker compose up -d --build`

---

## 6. File Permissions

The `github-runner` user needs permissions to write to `/var/www/` and restart the `systemd` service.

1. **Directory Ownership:**
```bash
sudo chown -R github-runner:www-data /var/www/calit_online
sudo chmod -R 775 /var/www/calit_online
```

2. **Sudoers File (No Password for specific commands):**
Run `sudo visudo` and append:
```text
github-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart fastapi-app, /usr/bin/rsync
```

---

## 7. Rollback Strategy

1. **GitHub Actions Input:** Add a `workflow_dispatch` trigger allowing a manual run where you select a specific Git SHA or Tag to deploy.
2. **Health Check Failure:** In the CI/CD pipeline, if the `curl` health check fails, add a step with `if: failure()` to revert to the previous git commit and redeploy.
3. **Database:** Always run backward-compatible migrations. If a rollback is needed, the code reverts, but the DB schema stays compatible.

---

## 8. Domain Verification

To check if `calit.online` is pointing correctly to the server:
```bash
# Check A record
dig A calit.online +short
# Check CNAME or WWW
dig A www.calit.online +short
```
If the returned IP matches your server's public IP, DNS is propagated.

---

## 9. Firewall (UFW)

You must open Nginx and SSH ports.
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full' # Opens 80 and 443
sudo ufw enable
sudo ufw status
```
*If on GCP/AWS:* Ensure the VPC Firewall Rules also allow ingress on TCP ports 80 and 443 from `0.0.0.0/0`.

---

## 10. Monitoring

- **Uptime:** Use a free tool like **UptimeRobot** to ping `https://calit.online/api/health` every 5 minutes.
- **Logs:**
  - Nginx Access: `sudo tail -f /var/log/nginx/access.log`
  - Nginx Errors: `sudo tail -f /var/log/nginx/error.log`
  - FastAPI Logs: `sudo journalctl -u fastapi-app.service -f`
