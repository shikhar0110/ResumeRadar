# Deployment Guide

## Git Setup

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   ```

2. **Add all files**:
   ```bash
   git add .
   ```

3. **Create initial commit**:
   ```bash
   git commit -m "Initial commit: Resume Radar - AI-powered resume analysis"
   ```

4. **Add remote repository** (replace with your GitHub repo URL):
   ```bash
   git remote add origin https://github.com/yourusername/resume-radar.git
   ```

5. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

## GitHub Pages Deployment

### Option 1: Automatic Deployment
1. Go to your GitHub repository
2. Click on "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"
7. Your site will be available at: `https://yourusername.github.io/resume-radar`

### Option 2: Manual Deployment
1. Create a `gh-pages` branch:
   ```bash
   git checkout -b gh-pages
   git push origin gh-pages
   ```

## Security Notes

- ✅ API keys have been removed from the code
- ✅ `.gitignore` file prevents accidental commit of sensitive files
- ✅ Users must configure their own API keys through the Settings modal
- ✅ No sensitive data is stored in the repository

## File Structure

```
resume-radar/
├── index.html          # Main application file
├── style.css           # Styling and animations
├── script.js           # Application logic
├── README.md           # Project documentation
├── .gitignore          # Git ignore rules
└── DEPLOYMENT.md       # This file
```

## Important Notes

- **API Keys Required**: Users must obtain and configure their own API keys
- **No Backend**: Application runs entirely in the browser
- **Cross-Origin**: May need to handle CORS issues when deployed
- **File Size**: Resume files must be under 5MB
