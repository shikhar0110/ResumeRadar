// Global variables
let selectedFile = null;
let extractedText = '';
let extractedSkills = [];

// API Configuration - These will be set by the user in the UI
let GEMINI_API_KEY = '';
let JSEARCH_API_KEY = '';

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

// Settings modal elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const jsearchApiKeyInput = document.getElementById('jsearchApiKey');
const showGeminiKeyBtn = document.getElementById('showGeminiKey');
const showJSearchKeyBtn = document.getElementById('showJSearchKey');
const saveApiKeysBtn = document.getElementById('saveApiKeysBtn');
const cancelApiKeysBtn = document.getElementById('cancelApiKeysBtn');
const geminiStatus = document.getElementById('geminiStatus');
const jsearchStatus = document.getElementById('jsearchStatus');

// Dark mode elements
const darkModeBtn = document.getElementById('darkModeBtn');

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

// Settings modal event listeners
settingsBtn.addEventListener('click', openSettingsModal);
closeModalBtn.addEventListener('click', closeSettingsModal);
saveApiKeysBtn.addEventListener('click', saveApiKeys);
cancelApiKeysBtn.addEventListener('click', closeSettingsModal);
showGeminiKeyBtn.addEventListener('click', () => togglePasswordVisibility(geminiApiKeyInput, showGeminiKeyBtn));
showJSearchKeyBtn.addEventListener('click', () => togglePasswordVisibility(jsearchApiKeyInput, showJSearchKeyBtn));

// Dark mode event listener
darkModeBtn.addEventListener('click', toggleDarkMode);

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettingsModal();
    }
});

// Dark Mode Functions
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    const icon = darkModeBtn.querySelector('i');
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        darkModeBtn.title = 'Switch to Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        darkModeBtn.title = 'Switch to Dark Mode';
    }
    
    // Add animation to the button
    darkModeBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        darkModeBtn.style.transform = 'translateY(-2px)';
    }, 300);
}

// Settings Modal Functions
function openSettingsModal() {
    // Load saved API keys
    geminiApiKeyInput.value = GEMINI_API_KEY;
    jsearchApiKeyInput.value = JSEARCH_API_KEY;
    
    // Update status indicators
    updateApiStatus();
    
    settingsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        button.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function updateApiStatus() {
    // Update Gemini status
    if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
        geminiStatus.textContent = 'Configured';
        geminiStatus.className = 'status-badge status-configured';
    } else {
        geminiStatus.textContent = 'Not configured';
        geminiStatus.className = 'status-badge status-unknown';
    }
    
    // Update JSearch status
    if (JSEARCH_API_KEY && JSEARCH_API_KEY.length > 10) {
        jsearchStatus.textContent = 'Configured';
        jsearchStatus.className = 'status-badge status-configured';
    } else {
        jsearchStatus.textContent = 'Not configured';
        jsearchStatus.className = 'status-badge status-unknown';
    }
}

function saveApiKeys() {
    const newGeminiKey = geminiApiKeyInput.value.trim();
    const newJSearchKey = jsearchApiKeyInput.value.trim();
    
    // Validate API keys
    if (!newGeminiKey || newGeminiKey.length < 10) {
        alert('Please enter a valid Gemini API key');
        return;
    }
    
    if (!newJSearchKey || newJSearchKey.length < 10) {
        alert('Please enter a valid JSearch API key');
        return;
    }
    
    // Save API keys
    GEMINI_API_KEY = newGeminiKey;
    JSEARCH_API_KEY = newJSearchKey;
    
    // Save to localStorage
    localStorage.setItem('geminiApiKey', GEMINI_API_KEY);
    localStorage.setItem('jsearchApiKey', JSEARCH_API_KEY);
    
    // Update status
    updateApiStatus();
    
    // Close modal
    closeSettingsModal();
    
    // Show success message
    showSuccessMessage('API keys saved successfully!');
}

function showSuccessMessage(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

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
    
    // Check if API keys are configured
    if (!GEMINI_API_KEY || !JSEARCH_API_KEY) {
        showError('Please configure your API keys first. Click the settings button to add your Gemini and JSearch API keys.');
        return;
    }
    
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

// Extract skills using Gemini API directly
async function extractSkillsWithGemini(resumeText) {
    try {
        const prompt = `Analyze the following resume text and extract all technical skills, programming languages, frameworks, tools, technologies, and certifications. Return only the skills as a comma-separated list without any additional text or explanations.

Resume text:
${resumeText}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `Gemini API error: ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content) {
            const skillsText = data.candidates[0].content.parts[0].text;
            
            // Parse skills
            const skills = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill && skill.length < 50);
            return skills.slice(0, 20); // Limit to 20 skills
        } else {
            throw new Error('Invalid response from Gemini API');
        }
        
    } catch (error) {
        console.error('Skill extraction error details:', error);
        throw new Error(`Failed to extract skills: ${error.message}`);
    }
}

// Search for jobs using JSearch API directly
async function searchJobsWithJSearch(skills, country = 'us') {
    try {
        // Create search query from top 5 skills
        const searchQuery = skills.slice(0, 5).join(' OR ');
        
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=1&num_pages=1&date_posted=all&remote_jobs_only=false&employment_types=FULLTIME%2CPARTTIME%2CCONTRACTOR&job_requirements=under_3_years_experience%2Cmore_than_3_years_experience%2Cno_experience&country=${country.toUpperCase()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': JSEARCH_API_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.message || `JSearch API error: ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const jobs = [];
        
        if (data.data) {
            for (const job of data.data.slice(0, 10)) {
                if (job.job_title && job.employer_name) {
                    jobs.push({
                        title: job.job_title,
                        company: job.employer_name,
                        location: job.job_city ? `${job.job_city}, ${job.job_state}` : (job.job_country || 'Remote'),
                        description: job.job_description ? (job.job_description.substring(0, 300) + '...') : 'No description available.',
                        link: job.job_apply_link || job.job_google_link || '#'
                    });
                }
            }
        }
        
        return jobs;
        
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
    console.log('Resume Radar initialized');
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update dark mode button icon
    const icon = darkModeBtn.querySelector('i');
    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
        darkModeBtn.title = 'Switch to Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        darkModeBtn.title = 'Switch to Dark Mode';
    }
    
    // Load saved API keys from localStorage
    GEMINI_API_KEY = localStorage.getItem('geminiApiKey') || '';
    JSEARCH_API_KEY = localStorage.getItem('jsearchApiKey') || '';
    
    console.log('Gemini API Key configured:', GEMINI_API_KEY && GEMINI_API_KEY.length > 10);
    console.log('JSearch API Key configured:', JSEARCH_API_KEY && JSEARCH_API_KEY.length > 10);
    
    // Update API status indicators
    updateApiStatus();
    
    // Check if API keys are configured
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
        console.warn('Please configure your Gemini API key');
    }
    
    if (!JSEARCH_API_KEY || JSEARCH_API_KEY.length < 10) {
        console.warn('Please configure your JSearch API key');
    }
    
    // Start country detection
    detectUserCountry();
});
