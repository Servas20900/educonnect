#!/usr/bin/env bash

set -euo pipefail

REPO_URL="${REPO_URL:-git@github.com:YOUR_ORG/YOUR_REPO.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="/home/ubuntu/educonnect"
BACKEND_DIR="$APP_DIR/educonnect-Backend"

sudo apt-get update
sudo apt-get install -y software-properties-common git nginx python3-pip
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

cd "$BACKEND_DIR"
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

python manage.py migrate
python manage.py collectstatic --noinput

sudo cp "$APP_DIR/deployment/nginx/educonnect" /etc/nginx/sites-available/educonnect
sudo ln -sf /etc/nginx/sites-available/educonnect /etc/nginx/sites-enabled/educonnect
sudo rm -f /etc/nginx/sites-enabled/default

sudo cp "$APP_DIR/deployment/systemd/gunicorn.service" /etc/systemd/system/gunicorn.service
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl restart gunicorn

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx