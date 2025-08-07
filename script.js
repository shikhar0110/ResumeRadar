// Global variables
let selectedFile = null;
let extractedText = '';
let extractedSkills = [];

// API Configuration - Get from environment variables
const GEMINI_API_KEY = window.GEMINI_API_KEY || 'your-gemini-api-key-here';
const JSEARCH_API_KEY = window.JSEARCH_API_KEY || 'your-jsearch-api-key-here';

// DOM Elements
const fileInput = document.getElementById('resumeFile');
const fileLabel = document.querySelector('.file-label');
const fileText = document.querySelector('.file-text');
const analyzeBtn = document.getElementById('analyzeBtn');
const fileError = document.getElementById('fileError');
const loadingState = document.getElementById('loadingState');
const skillsSection = document.getElementById('skillsSection');
const skillsList = document.getElementById('skillsList');
const jobsSection = document.getElementById('jobsSection');
const jobsList = document.getElementById('jobsList');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const countrySelect = document.getElementById('countrySelect');
const countryInfo = document.getElementById('countryInfo');
const countryText = document.getElementById('countryText');
const changeCountryBtn = document.getElementById('changeCountryBtn');
const countryOverride = document.querySelector('.country-override');

// Global variables for country detection
let detectedCountry = 'us'; // Default fallback
let countryName = 'United States';
let isCountryDetected = false;

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Event listeners
fileInput.addEventListener('change', handleFileSelection);
analyzeBtn.addEventListener('click', handleAnalyzeClick);
retryBtn.addEventListener('click', handleRetryClick);
changeCountryBtn.addEventListener('click', handleChangeCountryClick);
countrySelect.addEventListener('change', handleCountrySelectChange);

// File selection handler
function handleFileSelection(event) {
    const file = event.target.files[0];
    hideError();
    hideResults();
    
    if (!file) {
        selectedFile = null;
        updateUI();
        return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a PDF or DOCX file only.');
        fileInput.value = '';
        selectedFile = null;
        updateUI();
        return;
    }
    
    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File size must be less than 5MB. Please choose a smaller file.');
        fileInput.value = '';
        selectedFile = null;
        updateUI();
        return;
    }
    
    selectedFile = file;
    updateUI();
}

// Update UI based on file selection
function updateUI() {
    if (selectedFile) {
        fileText.textContent = `Selected: ${selectedFile.name}`;
        fileLabel.classList.add('file-selected');
        analyzeBtn.disabled = false;
    } else {
        fileText.textContent = 'Choose Resume File (PDF or DOCX)';
        fileLabel.classList.remove('file-selected');
        analyzeBtn.disabled = true;
    }
}

// Analyze button click handler
async function handleAnalyzeClick() {
    if (!selectedFile) return;
    
    try {
        hideError();
        hideResults();
        showLoading();
        
        // Step 1: Parse the resume
        setLoadingStep(1);
        extractedText = await parseResumeFile(selectedFile);
        
        if (!extractedText || extractedText.trim().length < 50) {
            throw new Error('Unable to extract sufficient text from the resume. Please ensure the file contains readable text.');
        }
        
        // Step 2: Extract skills using Gemini API
        setLoadingStep(2);
        extractedSkills = await extractSkillsWithGemini(extractedText);
        
        if (!extractedSkills || extractedSkills.length === 0) {
            throw new Error('No technical skills could be identified in the resume. Please ensure your resume contains technical skills and try again.');
        }
        
        // Step 3: Search for jobs
        setLoadingStep(3);
        const searchCountry = countrySelect.style.display !== 'none' ? countrySelect.value : detectedCountry;
        const jobs = await searchJobsWithJSearch(extractedSkills, searchCountry);
        
        hideLoading();
        displayResults(extractedSkills, jobs);
        
    } catch (error) {
        hideLoading();
        console.error('Analysis error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        const errorMsg = error.message || 'An unexpected error occurred. Please check your API keys and try again.';
        showError(`Analysis failed: ${errorMsg}`);
    }
}

// Parse resume file (PDF or DOCX)
async function parseResumeFile(file) {
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
        return await parsePDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await parseDOCX(file);
    } else {
        throw new Error('Unsupported file type.');
    }
}

// Parse PDF file using PDF.js
async function parsePDF(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
            try {
                const typedArray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let fullText = '';
                
                // Extract text from all pages
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                }
                
                resolve(fullText.trim());
            } catch (error) {
                reject(new Error(`Failed to parse PDF: ${error.message}`));
            }
        };
        
        fileReader.onerror = () => {
            reject(new Error('Failed to read the PDF file.'));
        };
        
        fileReader.readAsArrayBuffer(file);
    });
}

// Parse DOCX file using Mammoth.js
async function parseDOCX(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
            try {
                const arrayBuffer = this.result;
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                resolve(result.value);
            } catch (error) {
                reject(new Error(`Failed to parse DOCX: ${error.message}`));
            }
        };
        
        fileReader.onerror = () => {
            reject(new Error('Failed to read the DOCX file.'));
        };
        
        fileReader.readAsArrayBuffer(file);
    });
}

// Extract skills using server-side proxy
async function extractSkillsWithGemini(resumeText) {
    try {
        const response = await fetch('/api/extract-skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                resumeText: resumeText
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.skills || [];
        
    } catch (error) {
        console.error('Skill extraction error details:', error);
        throw new Error(`Failed to extract skills: ${error.message}`);
    }
}

// Search for jobs using server-side proxy
async function searchJobsWithJSearch(skills, country = 'us') {
    try {
        const response = await fetch('/api/search-jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                skills: skills,
                country: country
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.jobs || [];
        
    } catch (error) {
        console.error('Job search error details:', error);
        throw new Error(`Failed to search jobs: ${error.message}`);
    }
}

// UI Helper Functions
function showLoading() {
    loadingState.style.display = 'block';
    setLoadingStep(1);
}

function hideLoading() {
    loadingState.style.display = 'none';
}

function setLoadingStep(stepNumber) {
    // Reset all steps
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    
    // Activate current and previous steps
    for (let i = 1; i <= stepNumber; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) step.classList.add('active');
    }
}

function showError(message) {
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function hideError() {
    errorSection.style.display = 'none';
    fileError.style.display = 'none';
}

function hideResults() {
    skillsSection.style.display = 'none';
    jobsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function displayResults(skills, jobs) {
    // Display skills
    skillsSection.style.display = 'block';
    skillsList.innerHTML = '';
    
    skills.forEach((skill, index) => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.textContent = skill;
        skillTag.style.animationDelay = `${index * 0.1}s`;
        skillsList.appendChild(skillTag);
    });
    
    // Display jobs
    jobsSection.style.display = 'block';
    jobsList.innerHTML = '';
    
    const selectedCountryName = countrySelect.style.display !== 'none' ? 
        countrySelect.options[countrySelect.selectedIndex].text : 
        countryName;
    
    if (jobs.length === 0) {
        const noJobsMessage = document.createElement('div');
        noJobsMessage.className = 'no-jobs-message';
        noJobsMessage.innerHTML = `
            <p style="text-align: center; color: #64748b; padding: 40px;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
                No job matches found in ${selectedCountryName} at the moment. Try selecting a different country or updating your resume with more specific technical skills.
            </p>
        `;
        jobsList.appendChild(noJobsMessage);
    } else {
        jobs.forEach((job, index) => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.style.animationDelay = `${index * 0.1}s`;
            
            jobCard.innerHTML = `
                <div class="job-title">${escapeHtml(job.title)}</div>
                <div class="job-company">${escapeHtml(job.company)}</div>
                <div class="job-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${escapeHtml(job.location)}
                </div>
                <div class="job-description">${escapeHtml(job.description)}</div>
                <a href="${job.link}" target="_blank" rel="noopener noreferrer" class="job-link">
                    View Job Details
                    <i class="fas fa-external-link-alt"></i>
                </a>
            `;
            
            jobsList.appendChild(jobCard);
        });
    }
}

// Retry functionality
function handleRetryClick() {
    hideError();
    hideResults();
    if (selectedFile) {
        handleAnalyzeClick();
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Handle file input error display
function showError(message) {
    if (message.includes('Please select') || message.includes('File size')) {
        fileError.textContent = message;
        fileError.style.display = 'block';
    } else {
        errorSection.style.display = 'block';
        errorMessage.textContent = message;
    }
}

// Country code mapping
const countryMapping = {
    'US': { code: 'us', name: 'United States' },
    'CA': { code: 'ca', name: 'Canada' },
    'GB': { code: 'gb', name: 'United Kingdom' },
    'UK': { code: 'gb', name: 'United Kingdom' },
    'AU': { code: 'au', name: 'Australia' },
    'DE': { code: 'de', name: 'Germany' },
    'FR': { code: 'fr', name: 'France' },
    'NL': { code: 'nl', name: 'Netherlands' },
    'SG': { code: 'sg', name: 'Singapore' },
    'IN': { code: 'in', name: 'India' },
    'JP': { code: 'jp', name: 'Japan' },
    'BR': { code: 'br', name: 'Brazil' },
    'MX': { code: 'mx', name: 'Mexico' }
};

// Detect user's country based on IP
async function detectUserCountry() {
    try {
        countryText.textContent = 'Detecting your location...';
        
        // Try multiple IP geolocation services for better reliability
        const services = [
            'https://ipapi.co/json/',
            'http://ip-api.com/json/',
            'https://ipinfo.io/json'
        ];
        
        for (const service of services) {
            try {
                const response = await fetch(service);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Extract country code from different service response formats
                    let countryCode = data.country || data.country_code || data.countryCode;
                    
                    if (countryCode && countryMapping[countryCode.toUpperCase()]) {
                        const country = countryMapping[countryCode.toUpperCase()];
                        detectedCountry = country.code;
                        countryName = country.name;
                        isCountryDetected = true;
                        
                        // Update UI
                        countryText.textContent = `Jobs will be searched in: ${countryName}`;
                        countryInfo.classList.add('detected');
                        countryOverride.style.display = 'block';
                        
                        // Set the select value to match detected country
                        countrySelect.value = detectedCountry;
                        
                        console.log(`Country detected: ${countryName} (${detectedCountry})`);
                        return;
                    }
                }
            } catch (serviceError) {
                console.warn(`Failed to get location from ${service}:`, serviceError);
                continue;
            }
        }
        
        throw new Error('All geolocation services failed');
        
    } catch (error) {
        console.warn('Country detection failed:', error);
        // Fallback to default country
        countryText.textContent = `Jobs will be searched in: ${countryName} (default)`;
        countryInfo.classList.add('detected');
        countryOverride.style.display = 'block';
    }
}

// Handle change country button click
function handleChangeCountryClick() {
    countrySelect.style.display = countrySelect.style.display === 'none' ? 'inline-block' : 'none';
}

// Handle country selection change
function handleCountrySelectChange() {
    const selectedCountry = countrySelect.options[countrySelect.selectedIndex];
    countryText.textContent = `Jobs will be searched in: ${selectedCountry.text}`;
    countryName = selectedCountry.text;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Resume Skills Analyzer initialized');
    console.log('Gemini API Key configured:', GEMINI_API_KEY !== 'your-gemini-api-key-here' && GEMINI_API_KEY !== 'API_KEY_PLACEHOLDER');
    console.log('JSearch API Key configured:', JSEARCH_API_KEY !== 'your-jsearch-api-key-here' && JSEARCH_API_KEY !== 'JSEARCH_KEY_PLACEHOLDER');
    
    // Check if API keys are configured
    if (GEMINI_API_KEY === 'your-gemini-api-key-here' || GEMINI_API_KEY === 'API_KEY_PLACEHOLDER') {
        console.warn('Please configure your Gemini API key');
    }
    
    if (JSEARCH_API_KEY === 'your-jsearch-api-key-here' || JSEARCH_API_KEY === 'JSEARCH_KEY_PLACEHOLDER') {
        console.warn('Please configure your JSearch API key');
    }
    
    // Start country detection
    detectUserCountry();
});
