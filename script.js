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

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Event listeners
fileInput.addEventListener('change', handleFileSelection);
analyzeBtn.addEventListener('click', handleAnalyzeClick);
retryBtn.addEventListener('click', handleRetryClick);

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
        const jobs = await searchJobsWithJSearch(extractedSkills);
        
        hideLoading();
        displayResults(extractedSkills, jobs);
        
    } catch (error) {
        hideLoading();
        showError(`Analysis failed: ${error.message}`);
        console.error('Analysis error:', error);
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

// Extract skills using Google Gemini API
async function extractSkillsWithGemini(resumeText) {
    const prompt = `Analyze the following resume text and extract all technical skills, programming languages, frameworks, tools, technologies, and certifications. Return only the skills as a comma-separated list without any additional text or explanations.

Resume text:
${resumeText}`;

    try {
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
            throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from Gemini API');
        }

        const skillsText = data.candidates[0].content.parts[0].text;
        
        // Parse comma-separated skills and clean them up
        const skills = skillsText
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0 && skill.length < 50) // Filter out empty and overly long entries
            .slice(0, 20); // Limit to first 20 skills

        return skills;
        
    } catch (error) {
        throw new Error(`Failed to extract skills: ${error.message}`);
    }
}

// Search for jobs using JSearch API
async function searchJobsWithJSearch(skills) {
    // Create search query from skills (use first 5 skills for better results)
    const searchQuery = skills.slice(0, 5).join(' OR ');
    
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&page=1&num_pages=1&date_posted=all&remote_jobs_only=false`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': JSEARCH_API_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`JSearch API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
            return []; // Return empty array if no jobs found
        }

        // Filter and format jobs
        const jobs = data.data
            .filter(job => job && job.job_title && job.employer_name)
            .slice(0, 10) // Limit to 10 jobs
            .map(job => ({
                title: job.job_title,
                company: job.employer_name,
                location: job.job_city && job.job_state ? 
                    `${job.job_city}, ${job.job_state}` : 
                    (job.job_country || 'Remote'),
                description: job.job_description ? 
                    job.job_description.substring(0, 300) + (job.job_description.length > 300 ? '...' : '') : 
                    'No description available.',
                link: job.job_apply_link || job.job_google_link || '#',
                postedDate: job.job_posted_at_date_time || 'Recently'
            }));

        return jobs;
        
    } catch (error) {
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
    
    if (jobs.length === 0) {
        const noJobsMessage = document.createElement('div');
        noJobsMessage.className = 'no-jobs-message';
        noJobsMessage.innerHTML = `
            <p style="text-align: center; color: #64748b; padding: 40px;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
                No job matches found at the moment. Try updating your resume with more specific technical skills or check back later.
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Resume Skills Analyzer initialized');
    
    // Check if API keys are configured
    if (GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.warn('Please configure your Gemini API key');
    }
    
    if (JSEARCH_API_KEY === 'your-jsearch-api-key-here') {
        console.warn('Please configure your JSearch API key');
    }
});
