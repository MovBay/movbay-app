module.exports = {
  "expo": {
    "name": "movbay-app",
    "slug": "movbay-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#F75F15"
      },
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyBIWbuoiQ82RjmlwD3HG6DEeEtb4VQg5b8"
        }
      },
      
      "package": "com.bright210.movbayapp",
      "googleServicesFile": "./google-services.json",
      "softwareKeyboardLayoutMode": "pan"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification.png",
          "color": "#F75F15"
        }
      ],
      
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#F75F15"
        }
      ],

      [
        "@intercom/intercom-react-native",
        {
          "appId": "abc123",
          "androidApiKey": "android_sdk-abc123",
          "iosApiKey": "ios_sdk-abc123",
          "intercomRegion": "EU" // Europe
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "c3097a2b-8e82-467a-a0a5-196aab16c2e2"
      }
    },
    "owner": "bright210"
  }
}
