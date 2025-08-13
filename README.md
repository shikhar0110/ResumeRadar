# Resume Radar 🚀

An AI-powered resume analysis and job search application that helps you find relevant job opportunities based on your skills and experience.

## ✨ Features

- **📄 Resume Analysis**: Upload your PDF or DOCX resume and extract technical skills using AI
- **🔍 Smart Job Search**: Find relevant job opportunities in India based on your extracted skills
- **🎯 Skill Extraction**: Uses Google's Gemini AI to intelligently identify technical skills from your resume
- **🌍 Multi-City Search**: Searches across major Indian cities (Mumbai, Bangalore, Delhi, Hyderabad, Chennai, Pune)
- **🌙 Dark Mode**: Toggle between light and dark themes for better user experience
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **AI Services**: Google Gemini AI (skill extraction)
- **Job APIs**: RapidAPI JSearch (job listings)
- **PDF Processing**: PDF.js for PDF file parsing
- **Styling**: Custom CSS with animations and responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- API Keys:
  - Google Gemini API key
  - RapidAPI key (for JSearch)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resume-radar.git
   cd resume-radar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `server` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   RAPIDAPI_KEY=your_rapidapi_key_here
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Skill Extraction
- `POST /api/extract-skills` - Extract skills from resume text
  - Body: `{ "resumeText": "your resume content" }`

### Job Search
- `POST /api/search-jobs` - Search for jobs based on skills
  - Body: `{ "skills": ["JavaScript", "React"], "country": "in" }`

### Test Endpoint
- `GET /api/test-search` - Test job search functionality

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `RAPIDAPI_KEY` | RapidAPI key for JSearch | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 8080) | No |

### Getting API Keys

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

#### RapidAPI Key
1. Go to [RapidAPI](https://rapidapi.com)
2. Sign up for an account
3. Subscribe to the "JSearch" API
4. Copy your API key from the dashboard

## 📁 Project Structure

```
resume-radar/
├── index.html              # Main application file
├── style.css               # Styling and animations
├── script.js               # Frontend application logic
├── package.json            # Dependencies and scripts
├── README.md               # This file
├── .gitignore              # Git ignore rules
└── server/
    ├── index.js            # Backend server
    └── package.json        # Server dependencies
```

## 🎨 Features in Detail

### Resume Upload & Processing
- Supports PDF and DOCX files
- File size limit: 5MB
- Automatic text extraction using PDF.js
- AI-powered skill identification

### Job Search Algorithm
- Searches across 6 major Indian cities
- Uses JSearch API for comprehensive job listings
- Filters jobs based on extracted skills
- Removes duplicates and provides unique results
- Limits results to 10 most relevant jobs

### User Interface
- Modern, responsive design
- Dark/Light mode toggle
- Loading states and error handling
- File drag-and-drop support
- Mobile-friendly interface

## 🔒 Security Features

- API keys stored as environment variables
- No sensitive data in client-side code
- CORS properly configured
- Input validation and sanitization
- File type and size restrictions

## 🚀 Deployment

### Render Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Create a new Web Service
   - Set environment variables
   - Deploy!

### Environment Variables for Production
- `GEMINI_API_KEY`: Your Gemini API key
- `RAPIDAPI_KEY`: Your RapidAPI key
- `NODE_ENV`: `production`

## 🐛 Troubleshooting

### Common Issues

1. **"No job matches found"**
   - Check your RapidAPI key is valid
   - Ensure you have an active JSearch subscription
   - Try with different skills

2. **"No skills extracted"**
   - Verify your Gemini API key
   - Ensure resume contains technical skills
   - Check resume format (PDF/DOCX)

3. **File upload errors**
   - Check file size (max 5MB)
   - Ensure file is PDF or DOCX
   - Clear browser cache

### Debug Mode
Run the test endpoint to check API connectivity:
```bash
curl http://localhost:8080/api/test-search
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for skill extraction
- RapidAPI JSearch for job listings
- PDF.js for PDF processing
- The open-source community for inspiration

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the server logs for error messages
3. Ensure all environment variables are set correctly
4. Verify API keys are valid and have sufficient credits

---

**Made with ❤️ for job seekers everywhere**
