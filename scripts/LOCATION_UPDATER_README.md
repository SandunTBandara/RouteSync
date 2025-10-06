# Automated Location Updater

This script automatically updates bus locations every 5 minutes to simulate real-time GPS tracking.

## Features

- 🕐 **Automatic Updates**: Updates location every 5 minutes using cron scheduling
- 🔐 **JWT Authentication**: Handles automatic token refresh
- 📍 **Realistic GPS Simulation**: Generates GPS coordinates with realistic variations around Colombo
- 🛡️ **Error Handling**: Robust error handling with retry logic
- 📊 **Detailed Logging**: Console output with timestamps and status updates
- 🌏 **Timezone Support**: Uses Asia/Colombo timezone
- ⚙️ **Configurable**: Easy to customize bus ID, update interval, and location area

## Installation

1. Install dependencies:

```bash
pnpm install
```

The script requires these packages (already added to package.json):

- `node-cron`: For scheduling periodic updates
- `axios`: For making HTTP requests to the API

## Usage

### Start the Location Updater

```bash
# Using npm script (recommended)
pnpm location-updater

# Or directly
node scripts/autoLocationUpdater.js
```

### View Help Information

```bash
pnpm location-updater:help
```

### Run with Main API Server

**Terminal 1 - Start API Server:**

```bash
pnpm start
```

**Terminal 2 - Start Location Updater:**

```bash
pnpm location-updater
```

## Configuration

### Environment Variables (.env)

```env
API_BASE_URL=http://localhost:3000/api/v1
```

### Script Configuration

Edit the `CONFIG` object in `autoLocationUpdater.js`:

```javascript
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3000/api/v1",
  BUS_ID: "68d97a9db64b7cfce8e3c4c5", // Change this to your bus ID
  UPDATE_INTERVAL: "*/5 * * * *", // Every 5 minutes
  ADMIN_EMAIL: "testadmin@busroute.com",
  ADMIN_PASSWORD: "admin123",
};
```

### Cron Schedule Examples

- Every 1 minute: `'*/1 * * * *'`
- Every 5 minutes: `'*/5 * * * *'` (default)
- Every 10 minutes: `'*/10 * * * *'`
- Every 30 minutes: `'*/30 * * * *'`
- Every hour: `'0 * * * *'`

## GPS Simulation

The script simulates realistic bus movement:

- **Base Location**: Colombo, Sri Lanka (6.9271°N, 79.8612°E)
- **Movement Variation**: ±0.01 degrees (~1km radius)
- **Speed Range**: 20-80 km/h
- **Heading**: Random direction (0-360°)

To change the simulation area, modify the `generateLocationData()` function:

```javascript
function generateLocationData() {
  const baseLatitude = 6.9271; // Change to your city
  const baseLongitude = 79.8612; // Change to your city
  // ... rest of the function
}
```

## Output Example

```
🚀 Starting automated location updater...
==================================================
🚌 Bus ID: 68d97a9db64b7cfce8e3c4c5
⏰ Update interval: Every 5 minutes
🌐 API URL: http://localhost:3000/api/v1
👤 Admin User: testadmin@busroute.com
==================================================
🔑 Authenticating...
✅ Authentication successful
✅ Bus validation successful
⏰ Scheduling cron job...
🎯 Running initial location update...
🚌 Updating location for bus 68d97a9db64b7cfce8e3c4c5...
📍 Coordinates: 6.931245, 79.867834
🏃 Speed: 45 km/h, Heading: 180°
✅ Location updated successfully: 2025-10-06T10:15:00.000Z
📊 Response: Location updated successfully
🆔 Location ID: 68dac75c1036cd469d741f2d
---

✅ Automated location updater is now running!
📅 Next update scheduled in 5 minutes
💡 Press Ctrl+C to stop
📊 Monitor the console for update logs...
```

## Error Handling

The script handles various error scenarios:

- **Authentication Failures**: Auto-retry with fresh login
- **Token Expiration**: Automatic token refresh
- **Connection Issues**: Clear error messages
- **API Server Down**: Retry logic with informative errors
- **Invalid Bus ID**: Graceful handling with warnings

## Stopping the Script

- Press `Ctrl+C` for graceful shutdown
- The script will display final statistics before exiting

## Troubleshooting

### Common Issues

1. **Connection Refused**

   - Make sure the API server is running on port 3000
   - Check if the API_BASE_URL is correct

2. **Authentication Failed**

   - Verify admin credentials in CONFIG
   - Make sure testadmin user exists (run `pnpm seed:users`)

3. **Bus Not Found**

   - Check if the bus ID exists in your database
   - The script will continue anyway as the bus might be created later

4. **Permission Denied**
   - Ensure the admin user has proper permissions
   - Check if the user account is active

### Debug Mode

For more detailed debugging, you can modify the script to add more console.log statements or use a debugger.

## Integration with Frontend

This automated location updater provides real-time data that can be consumed by:

- Web dashboards showing live bus positions
- Mobile apps for passenger tracking
- Analytics systems for route optimization
- Real-time notifications and alerts

The location data is stored in MongoDB and can be retrieved via the location API endpoints.
