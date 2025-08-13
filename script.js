// Global variables
let selectedFile = null;
let extractedText = '';
let extractedSkills = [];

// Backend API base URL (will use relative paths for deployment)
const API_BASE_URL = '';

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


// Settings modal elements removed (keys are hardcoded)

// Dark mode elements
const darkModeBtn = document.getElementById('darkModeBtn');

// Fixed country for India
let countryName = 'India';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Event listeners
fileInput.addEventListener('change', handleFileSelection);
analyzeBtn.addEventListener('click', handleAnalyzeClick);
retryBtn.addEventListener('click', handleRetryClick);

// Settings modal removed

// Dark mode event listener
darkModeBtn.addEventListener('click', toggleDarkMode);

// Settings modal removed

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

// Settings modal functions removed

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
    
    // Keys are embedded; proceed
    
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
        
        // Step 3: Search for jobs in India
        setLoadingStep(3);
        const jobs = await searchJobsWithJSearch(extractedSkills, 'in');
        
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

// Extract skills via backend proxy (Gemini on server)
async function extractSkillsWithGemini(resumeText) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/extract-skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || `Gemini API error: ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (Array.isArray(data.skills)) return data.skills;
        throw new Error('Invalid response from backend');
        
    } catch (error) {
        console.error('Skill extraction error details:', error);
        throw new Error(`Failed to extract skills: ${error.message}`);
    }
}

// Search for jobs via backend proxy (RapidAPI JSearch on server)
async function searchJobsWithJSearch(skills, country = 'us') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/search-jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills, country })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || `JSearch API error: ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (Array.isArray(data.jobs)) return data.jobs;
        return [];
        
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
    
    const selectedCountryName = 'India';
    
    if (jobs.length === 0) {
        const noJobsMessage = document.createElement('div');
        noJobsMessage.className = 'no-jobs-message';
        noJobsMessage.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 40px;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
                <p style="margin-bottom: 20px;">No job matches found in India at the moment.</p>
                <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h4 style="margin-bottom: 15px; color: #475569;">Suggestions to improve your search:</h4>
                    <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                        <li>Try selecting a different country</li>
                        <li>Update your resume with more specific technical skills</li>
                        <li>Use broader skill terms (e.g., "JavaScript" instead of "ES6")</li>
                        <li>Include popular frameworks and tools</li>
                    </ul>
                </div>

            </div>
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
    
    // Using backend proxy; no client-side API keys
    
    console.log('Resume Radar initialized for India job search');
});
