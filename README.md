# Resume Radar

A pure JavaScript web application that analyzes resumes to extract skills and find matching job opportunities using AI.

## Features

- 📄 Upload PDF or DOCX resumes
- 🤖 AI-powered skill extraction using Google Gemini
- 💼 Job search integration using JSearch API
- 🌍 Automatic country detection for job search
- 📱 Responsive web interface
- ⚙️ Built-in API key configuration
- 🌙 Dark mode support
- 🎨 Beautiful animations and modern UI
- 🚀 No server setup required - runs entirely in the browser

## How to Run

### Option 1: Simple File Opening (Recommended)
1. Download all project files to a folder
2. Double-click `index.html` to open in your web browser
3. **Important**: Configure your API keys using the Settings button (see API Keys Setup below)
4. Start analyzing resumes!

### Option 2: Local Server (for development)
If you want to run it on a local server:

```bash
# Using Python (if you have Python installed)
python -m http.server 8000

# Using Node.js (if you have Node.js installed)
npx http-server

# Using PHP (if you have PHP installed)
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## API Keys Setup

The application requires two API keys that you can configure directly in the browser:

### 1. Gemini API Key (for skill extraction)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

### 2. JSearch API Key (for job search)
1. Visit [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Sign up for a free account
3. Subscribe to the JSearch API (free tier available)
4. Copy your RapidAPI key

### Configure API Keys
1. Open the application in your browser
2. Click the "Settings" button in the top-right corner
3. Enter your API keys in the configuration modal
4. Click "Save Configuration"
5. Your keys will be saved locally in your browser

## Usage

1. **Configure API Keys**: Click the Settings button and add your Gemini and JSearch API keys (required for functionality)
2. **Upload Resume**: Click "Choose Resume File" and select a PDF or DOCX file
3. **Analyze**: Click "Analyze Resume" to extract skills
4. **View Results**: See extracted skills and matching job opportunities
5. **Job Search**: Browse job listings based on your skills

## File Structure

- `index.html` - Main web interface with settings modal
- `style.css` - Styling for the web interface and modal
- `script.js` - Frontend JavaScript functionality with API integration
- `README.md` - This documentation file

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript
- **PDF Parsing**: PDF.js library
- **DOCX Parsing**: Mammoth.js library
- **AI Integration**: Direct API calls to Google Gemini
- **Job Search**: Direct API calls to JSearch via RapidAPI
- **Data Storage**: Browser localStorage for API keys
- **No Backend**: Everything runs in the browser

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Privacy & Security

- All processing happens in your browser
- API keys are stored locally in your browser's localStorage
- No data is sent to any server except the API providers (Gemini and JSearch)
- Resume content is only sent to Google Gemini for skill extraction

## Troubleshooting

- **API Key Errors**: Make sure your API keys are correctly configured in Settings
- **File Upload Issues**: Ensure the file is PDF or DOCX format and under 5MB
- **CORS Errors**: If you see CORS errors, try opening the file directly instead of through a local server
- **API Limits**: Free tiers have usage limits - check your API provider's documentation

## License

ISC License
