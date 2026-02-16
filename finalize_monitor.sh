#!/bin/bash
exec > >(tee -i node_install.log)
exec 2>&1

echo "Waiting for apt lock..."
while sudo fuser /var/lib/dpkg/lock >/dev/null 2>&1 ; do
    sleep 5
done 

echo "Apt done."

# Symlink nodejs -> node if needed
if ! command -v node &> /dev/null; then
  echo "Node command not found"
  if command -v nodejs &> /dev/null; then
      echo "nodejs binary found at $(which nodejs). Creating symlink..."
      sudo ln -sf $(which nodejs) /usr/bin/node
  else
      echo "nodejs not found! Trying to install again..."
      sudo apt-get update -y
      sudo apt-get install -y nodejs npm
  fi
fi

echo "Verifying node version:"
node -v || echo "node failed"
nodejs -v || echo "nodejs failed"

echo "Deploying service..."
if [ -f ~/sipoma-monitor.service ]; then
    sudo mv -f ~/sipoma-monitor.service /etc/systemd/system/sipoma-monitor.service
fi

sudo systemctl daemon-reload
sudo systemctl enable sipoma-monitor
sudo systemctl restart sipoma-monitor
sudo systemctl status sipoma-monitor --no-pager

echo "Done!"
