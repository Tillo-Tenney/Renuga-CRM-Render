# Troubleshooting "No token provided" Error

## Problem

After successful deployment on Render, users may encounter a "No token provided" error when attempting to login. This typically occurs when the frontend cannot communicate with the backend API.

## Root Cause

The issue stems from the API URL configuration in the frontend build:

1. **Static Build Limitation**: Vite embeds environment variables at build time, not runtime
2. **Missing/Incorrect API URL**: If `VITE_API_URL` isn't set during build, the frontend defaults to `http://localhost:3001`
3. **CORS Issues**: If the frontend tries to connect to localhost from a deployed site, authentication fails

## Solution Implemented

We've implemented a hybrid configuration approach that supports both build-time and runtime configuration:

### 1. Runtime Configuration Support

A new `public/config.js` file allows the API URL to be configured after the build:

```javascript
window.__RUNTIME_CONFIG__ = {
  apiUrl: 'https://your-api-url.onrender.com'
};
```

### 2. Build-Time Injection

The build process (`npm run build`) automatically injects the `VITE_API_URL` environment variable into `config.js`:

```bash
VITE_API_URL=https://your-api.onrender.com npm run build
```

### 3. Fallback Chain

The frontend checks for API URL in this order:
1. Runtime config (`window.__RUNTIME_CONFIG__.apiUrl`)
2. Build-time environment variable (`import.meta.env.VITE_API_URL`)
3. Development default (`http://localhost:3001`)

## Verification Steps

### Check API URL in Browser

1. Open your deployed frontend in a browser
2. Open browser console (F12)
3. Look for log message: `[API Config] Using runtime config: https://...`

### Verify config.js

1. Navigate to `https://your-frontend.onrender.com/config.js`
2. Check that `apiUrl` contains your backend URL
3. If it shows `'__VITE_API_URL__'`, the build didn't receive the environment variable

## Render Deployment Configuration

The `render.yaml` file is already configured correctly:

```yaml
- type: web
  name: renuga-crm-frontend
  envVars:
    - key: VITE_API_URL
      fromService:
        type: web
        name: renuga-crm-api
        property: url
```

This automatically sets `VITE_API_URL` to the backend URL during build.

## Manual Fix (If Needed)

If you deployed manually without using `render.yaml`:

### Option 1: Set Environment Variable in Render

1. Go to your frontend service in Render dashboard
2. Navigate to **Environment** tab
3. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL (e.g., `https://renuga-crm-api.onrender.com`)
4. Trigger a manual deploy

### Option 2: Modify config.js After Build

If you have SSH access or can modify deployed files:

1. Locate `dist/config.js` in your deployment
2. Edit the file:
```javascript
window.__RUNTIME_CONFIG__ = {
  apiUrl: 'https://your-actual-backend-url.onrender.com'
};
```
3. Save and refresh the frontend

### Option 3: Use Custom Build Script

Create a custom build script that sets the environment variable:

```bash
#!/bin/bash
export VITE_API_URL="https://your-backend-url.onrender.com"
npm run build
```

## Testing Locally

To test this configuration locally:

```bash
# Build with a test API URL
VITE_API_URL=https://test-api.example.com npm run build

# Check the generated config
cat dist/config.js

# Serve the build locally
npx serve dist

# Open browser and check console for API config log
```

## Common Issues

### Issue: Config shows `__VITE_API_URL__`

**Cause**: Environment variable not set during build

**Solution**: 
- Verify `VITE_API_URL` is set in Render environment variables
- Check build logs for the injection message
- Redeploy with correct environment variable

### Issue: CORS errors in browser

**Cause**: Backend `FRONTEND_URL` doesn't match actual frontend URL

**Solution**:
1. Check backend environment variable `FRONTEND_URL`
2. Update to match your frontend URL
3. Redeploy backend service

### Issue: Still getting "No token provided"

**Cause**: Token not being sent with requests

**Solution**:
1. Clear browser localStorage: `localStorage.clear()`
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Try logging in again

## Debugging Checklist

- [ ] Check browser console for API config log
- [ ] Verify `/config.js` has correct API URL
- [ ] Check Network tab for failed API requests
- [ ] Verify backend is running and healthy (`/health` endpoint)
- [ ] Confirm CORS is configured correctly in backend
- [ ] Clear browser cache and localStorage
- [ ] Check Render build logs for injection success message

## Prevention

To prevent this issue in future deployments:

1. **Always use `render.yaml`**: It automatically configures environment variables
2. **Verify environment variables**: Check Render dashboard before deploying
3. **Test after deployment**: Verify API connectivity immediately after deployment
4. **Monitor logs**: Check build logs for the config injection message
5. **Document your URLs**: Keep track of frontend and backend URLs

## Related Files

- `/public/config.js` - Runtime configuration file
- `/src/services/api.ts` - API client with configuration logic
- `/inject-config.mjs` - Build script that injects API URL
- `/render.yaml` - Deployment configuration
- `/index.html` - Loads config.js before app initialization

## Support

If you continue to experience issues:

1. Check the build logs in Render dashboard
2. Verify all environment variables are set correctly
3. Test the API health endpoint directly: `https://your-api.onrender.com/health`
4. Open a GitHub issue with relevant logs and error messages
