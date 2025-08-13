const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const path = require('path');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Serve the main HTML file for all routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test endpoint for debugging
app.get('/api/test-search', async (req, res) => {
    try {
        const rapidKey = process.env.RAPIDAPI_KEY;
        if (!rapidKey) {
            return res.status(500).json({ error: 'RAPIDAPI_KEY not configured' });
        }
        
        // Test with a simple search for India
        const testSkills = ['JavaScript', 'React'];
        
        console.log('Testing job search for India with:', { testSkills });
        
        let jobs = [];
        // Use JSearch for India only
        jobs = await searchJSearchJobs(testSkills, 'in', rapidKey);
        
        res.json({ 
            success: true, 
            jobsFound: jobs.length,
            jobs: jobs.slice(0, 3) // Return first 3 jobs for testing
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
});

// Extract skills via Gemini (server-side)
app.post('/api/extract-skills', async (req, res) => {
    try {
        const { resumeText } = req.body || {};
        if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 10) {
            return res.status(400).json({ error: 'Invalid resumeText' });
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return res.status(500).json({ error: 'Server not configured: missing GEMINI_API_KEY' });
        }

        const prompt = `Analyze the following resume text and extract all technical skills, programming languages, frameworks, tools, technologies, and certifications that are commonly used in job searches. Focus on popular and widely-recognized skills. Return only the skills as a comma-separated list without any additional text or explanations. Include both specific technologies (e.g., "JavaScript", "Python", "React") and broader categories (e.g., "Web Development", "Data Analysis") if mentioned.\n\nResume text:\n${resumeText}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

        const { data } = await axios.post(url, {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048
            }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Debug: Log the Gemini response
        console.log('Gemini API Response:', JSON.stringify(data, null, 2));

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
            console.error('Gemini API Error - No text in response:', data);
            return res.status(502).json({ error: 'Invalid response from Gemini - no text generated' });
        }

        const skills = text
            .split(',')
            .map(s => s.trim())
            .filter(s => s && s.length < 50)
            .slice(0, 20);

        console.log('Extracted skills:', skills);
        return res.json({ skills });
    } catch (err) {
        const message = err?.response?.data?.error?.message || err?.message || 'Unknown error';
        return res.status(502).json({ error: `Gemini request failed: ${message}` });
    }
});

// Search jobs via RapidAPI LinkedIn Job Search (server-side)
app.post('/api/search-jobs', async (req, res) => {
    try {
        const { skills, country } = req.body || {};
        if (!Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({ error: 'Invalid skills' });
        }

        const rapidKey = process.env.RAPIDAPI_KEY;
        if (!rapidKey) {
            return res.status(500).json({ error: 'Server not configured: missing RAPIDAPI_KEY' });
        }

        // Use JSearch API for India only
        let jobs = [];
        
        console.log(`Searching jobs for India with skills:`, skills);
        
        // Use JSearch API for India only
        console.log('Using JSearch API for India');
        jobs = await searchJSearchJobs(skills, 'in', rapidKey);

        console.log(`Found ${jobs.length} jobs for India`);
        return res.json({ jobs });
    } catch (err) {
        const message = err?.response?.data?.message || err?.message || 'Unknown error';
        return res.status(502).json({ error: `Job search API request failed: ${message}` });
    }
});



// Search jobs using JSearch API for India
async function searchJSearchJobs(skills, country, rapidKey) {
    try {
        const searchQuery = skills.slice(0, 3).join(' ');
        
        // Try multiple major Indian cities to get India-based jobs
        const indianCities = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'];
        let allJobs = [];
        
        for (const city of indianCities.slice(0, 3)) { // Limit to top 3 cities
            try {
                const options = {
                    method: 'GET',
                    url: 'https://jsearch.p.rapidapi.com/search',
                    headers: {
                        'x-rapidapi-key': rapidKey,
                        'x-rapidapi-host': 'jsearch.p.rapidapi.com'
                    },
                    params: {
                        query: searchQuery,
                        location: city + ', India',
                        page: '1',
                        num_pages: '1'
                    }
                };

                const { data } = await axios.request(options);
                
                if (Array.isArray(data?.data)) {
                    for (const job of data.data.slice(0, 5)) { // Limit per city
                        if (job?.job_title && job?.employer_name) {
                            // Limit description to 100 words
                            const description = job.job_description || 'No description available.';
                            const limitedDescription = description.split(' ').slice(0, 100).join(' ') + (description.split(' ').length > 100 ? '...' : '');
                            
                            allJobs.push({
                                title: job.job_title,
                                company: job.employer_name,
                                location: job.job_city || city + ', India',
                                description: limitedDescription,
                                link: job.job_apply_link || job.job_google_link || '#'
                            });
                        }
                    }
                }
            } catch (cityError) {
                console.warn(`Failed to search in ${city}:`, cityError.message);
                continue;
            }
        }
        
        // Remove duplicates and return unique jobs
        const uniqueJobs = allJobs.filter((job, index, self) => 
            index === self.findIndex(j => j.title === job.title && j.company === job.company)
        );
        
        console.log(`JSearch found ${uniqueJobs.length} jobs for India`);
        return uniqueJobs.slice(0, 10);
    } catch (error) {
        console.warn('JSearch job search failed:', error.message);
        return [];
    }
}



// Helper function to get country name from code
function getCountryName(countryCode) {
    const countryNames = {
        'us': 'United States',
        'ca': 'Canada',
        'gb': 'United Kingdom',
        'au': 'Australia',
        'de': 'Germany',
        'fr': 'France',
        'nl': 'Netherlands',
        'sg': 'Singapore',
        'in': 'India',
        'jp': 'Japan',
        'br': 'Brazil',
        'mx': 'Mexico'
    };
    return countryNames[countryCode] || 'United States';
}

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});


