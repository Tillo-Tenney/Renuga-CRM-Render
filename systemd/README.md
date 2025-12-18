# Systemd Service Files for Renuga CRM

This directory contains systemd service files as an alternative to PM2 for managing the backend service.

## Installation

To use systemd instead of PM2:

```bash
# Copy service file to systemd directory
sudo cp systemd/renuga-crm-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable renuga-crm-api

# Start the service
sudo systemctl start renuga-crm-api

# Check status
sudo systemctl status renuga-crm-api
```

## Commands

```bash
# Start service
sudo systemctl start renuga-crm-api

# Stop service
sudo systemctl stop renuga-crm-api

# Restart service
sudo systemctl restart renuga-crm-api

# View logs
sudo journalctl -u renuga-crm-api -f

# View status
sudo systemctl status renuga-crm-api
```

## Notes

- The service runs as the `www-data` user
- Logs are sent to syslog and can be viewed with journalctl
- The service automatically restarts if it crashes
- Memory is limited to 1GB and CPU to 200%
- The service starts after PostgreSQL is ready
