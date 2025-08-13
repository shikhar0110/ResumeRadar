# Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)

## Deployment Steps

### 1. Prepare Your Repository
Your repository should now contain only the essential files:
```
resume-radar/
├── index.html          # Frontend application
├── style.css           # Styling
├── script.js           # Frontend logic
├── package.json        # Dependencies and scripts
├── server/
│   ├── index.js        # Backend server
│   └── package.json    # Server dependencies
├── .gitignore          # Git ignore rules
└── README.md           # Project documentation
```

### 2. Deploy on Render

1. **Sign up/Login to Render**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your code

3. **Configure the Service**
   - **Name**: `resume-radar` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you prefer)

4. **Add Environment Variables**
   Click "Environment" tab and add:
   - `GEMINI_API_KEY` = Your Gemini API key
   - `RAPIDAPI_KEY` = Your RapidAPI key
   - `NODE_ENV` = `production`

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Your app will be available at: `https://your-app-name.onrender.com`

## Environment Variables Setup

### Get API Keys

1. **Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key and add it as `GEMINI_API_KEY`

2. **RapidAPI Key**:
   - Go to [RapidAPI](https://rapidapi.com)
   - Sign up and subscribe to "JSearch" API
   - Copy your API key and add it as `RAPIDAPI_KEY`

## Important Notes

- ✅ **No sensitive data in code**: API keys are stored as environment variables
- ✅ **Automatic HTTPS**: Render provides SSL certificates
- ✅ **Auto-deploy**: Changes to your GitHub repo will trigger automatic deployments
- ✅ **Free tier**: Includes 750 hours/month of runtime

## Troubleshooting

### Common Issues:

1. **Build fails**: Check that all dependencies are in `package.json`
2. **API errors**: Verify environment variables are set correctly
3. **CORS issues**: The server is configured to handle CORS properly
4. **File upload issues**: Check file size limits (5MB max)

### Check Logs:
- Go to your Render dashboard
- Click on your service
- Check "Logs" tab for any error messages

## Security
- API keys are stored securely as environment variables
- No sensitive data is committed to the repository
- HTTPS is enabled by default on Render

Your application is now ready for production use!
