# 🚌 Automated Location Updater Setup Complete!

## ✅ **What's Been Added:**

### 1. **Main Script**: [`scripts/autoLocationUpdater.js`](scripts/autoLocationUpdater.js)

- Complete automated location updater with cron scheduling
- JWT authentication with auto-refresh
- Realistic GPS coordinate simulation
- Error handling and retry logic
- Graceful shutdown handling

### 2. **Dependencies Added**:

- `node-cron@3.0.3` - For scheduling location updates every 5 minutes
- `axios@1.12.2` - For making HTTP requests to your API

### 3. **Package.json Scripts**:

```json
{
  "location-updater": "node scripts/autoLocationUpdater.js",
  "location-updater:help": "node scripts/autoLocationUpdater.js --help"
}
```

### 4. **Environment Configuration**:

Added `API_BASE_URL=http://localhost:3000/api/v1` to `.env`

### 5. **Documentation**: [`scripts/LOCATION_UPDATER_README.md`](scripts/LOCATION_UPDATER_README.md)

- Complete usage instructions
- Configuration options
- Troubleshooting guide

## 🚀 **How to Use:**

### **Step 1: Start Your API Server**

```bash
pnpm start
```

### **Step 2: Start the Location Updater (in another terminal)**

```bash
pnpm location-updater
```

## 🎯 **Current Configuration:**

- **Bus ID**: `68d97a9db64b7cfce8e3c4c5`
- **Update Interval**: Every 5 minutes
- **Location**: Simulates movement around Colombo area
- **Speed Range**: 20-80 km/h
- **Authentication**: Uses testadmin credentials

## ⚙️ **Customization:**

To change the bus ID, edit the CONFIG object in [`scripts/autoLocationUpdater.js`](scripts/autoLocationUpdater.js):

```javascript
const CONFIG = {
  BUS_ID: "YOUR_BUS_ID_HERE", // Change this line
  UPDATE_INTERVAL: "*/5 * * * *", // Every 5 minutes
  // ... other settings
};
```

## 📊 **Expected Output:**

When you run `pnpm location-updater`, you'll see:

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
🎯 Running initial location update...
🚌 Updating location for bus 68d97a9db64b7cfce8e3c4c5...
📍 Coordinates: 6.931245, 79.867834
🏃 Speed: 45 km/h, Heading: 180°
✅ Location updated successfully: 2025-10-06T15:30:00.000Z
📊 Response: Location updated successfully

✅ Automated location updater is now running!
📅 Next update scheduled in 5 minutes
💡 Press Ctrl+C to stop
```

## 🎉 **Ready to Test!**

Your automated location updater is now fully configured and ready to use. It will:

1. **Authenticate** using admin credentials
2. **Update location** every 5 minutes
3. **Simulate realistic GPS movement** around Colombo
4. **Handle errors** gracefully with retry logic
5. **Log all activity** to the console

The location data will be stored in your MongoDB database and can be retrieved via your location API endpoints! 🚀
