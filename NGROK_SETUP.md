# ngrok Configuration

## Public URL
```
https://74a4e94bc4a8.ngrok-free.app
```

## Webhook URL (for Whop Dashboard)
```
https://74a4e94bc4a8.ngrok-free.app/api/webhooks/whop
```

## Local Dashboard
```
http://localhost:4040
```

## Commands

### Start ngrok
```bash
start-ngrok.bat
```

### Stop ngrok
```bash
# Find PID
cat ngrok.pid

# Kill process
taskkill /PID <PID> /F
```

### Restart ngrok
```bash
# Stop
taskkill /PID $(cat ngrok.pid) /F

# Start
start-ngrok.bat
```

## Configuration
- **Auth token**: Configured in `C:\Users\Thege\AppData\Local\ngrok\ngrok.yml`
- **Port**: 3000 (local dev server)
- **Protocol**: HTTP

## Important Notes
- ⚠️ ngrok URL changes when you restart ngrok
- ⚠️ Update Whop webhook URL if ngrok restarts
- ⚠️ Free ngrok has session limits (8 hours)
