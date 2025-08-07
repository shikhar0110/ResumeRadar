#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
import requests
from urllib.parse import urlparse, parse_qs

PORT = 5000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        
        # Handle root path
        if parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.serve_index_with_env()
        else:
            # Serve other files normally
            super().do_GET()
    
    def do_POST(self):
        # Handle API proxy requests
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/extract-skills':
            self.handle_extract_skills()
        elif parsed_path.path == '/api/search-jobs':
            self.handle_search_jobs()
        else:
            self.send_error(404, "API endpoint not found")
    
    def serve_index_with_env(self):
        try:
            # Read the index.html file
            with open('index.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Get API keys from environment variables
            gemini_key = os.environ.get('GEMINI_API_KEY', 'your-gemini-api-key-here')
            jsearch_key = os.environ.get('JSEARCH_API_KEY', 'your-jsearch-api-key-here')
            
            # Replace placeholders with actual API keys
            content = content.replace('API_KEY_PLACEHOLDER', gemini_key)
            content = content.replace('JSEARCH_KEY_PLACEHOLDER', jsearch_key)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Content-Length', len(content.encode('utf-8')))
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
            
        except FileNotFoundError:
            self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def handle_extract_skills(self):
        """Handle Gemini API skill extraction requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            resume_text = request_data.get('resumeText', '')
            
            # Get Gemini API key
            gemini_key = os.environ.get('GEMINI_API_KEY')
            if not gemini_key:
                self.send_json_error(400, "Gemini API key not configured")
                return
            
            # Prepare Gemini API request
            prompt = f"""Analyze the following resume text and extract all technical skills, programming languages, frameworks, tools, technologies, and certifications. Return only the skills as a comma-separated list without any additional text or explanations.

Resume text:
{resume_text}"""
            
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "topK": 1,
                    "topP": 1,
                    "maxOutputTokens": 2048,
                }
            }
            
            # Make request to Gemini API
            response = requests.post(
                gemini_url, 
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('candidates') and data['candidates'][0].get('content'):
                    skills_text = data['candidates'][0]['content']['parts'][0]['text']
                    
                    # Parse skills
                    skills = [skill.strip() for skill in skills_text.split(',')]
                    skills = [skill for skill in skills if skill and len(skill) < 50][:20]
                    
                    self.send_json_response({'skills': skills})
                else:
                    self.send_json_error(400, "Invalid response from Gemini API")
            else:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get('error', {}).get('message', 'Unknown error')
                self.send_json_error(response.status_code, f"Gemini API error: {error_msg}")
                
        except Exception as e:
            self.send_json_error(500, f"Failed to extract skills: {str(e)}")
    
    def handle_search_jobs(self):
        """Handle JSearch API job search requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            skills = request_data.get('skills', [])
            country = request_data.get('country', 'us')
            
            # Get JSearch API key
            jsearch_key = os.environ.get('JSEARCH_API_KEY')
            if not jsearch_key:
                self.send_json_error(400, "JSearch API key not configured")
                return
            
            # Create search query
            search_query = ' OR '.join(skills[:5])
            
            # JSearch API request
            url = f"https://jsearch.p.rapidapi.com/search?query={search_query}&page=1&num_pages=1&date_posted=all&remote_jobs_only=false&employment_types=FULLTIME%2CPARTTIME%2CCONTRACTOR&job_requirements=under_3_years_experience%2Cmore_than_3_years_experience%2Cno_experience&country={country.upper()}"
            
            headers = {
                'X-RapidAPI-Key': jsearch_key,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                jobs = []
                
                if data.get('data'):
                    for job in data['data'][:10]:
                        if job.get('job_title') and job.get('employer_name'):
                            jobs.append({
                                'title': job['job_title'],
                                'company': job['employer_name'],
                                'location': f"{job.get('job_city', '')}, {job.get('job_state', '')}" if job.get('job_city') else job.get('job_country', 'Remote'),
                                'description': (job.get('job_description', '')[:300] + '...') if job.get('job_description') else 'No description available.',
                                'link': job.get('job_apply_link') or job.get('job_google_link', '#')
                            })
                
                self.send_json_response({'jobs': jobs})
            else:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get('message', 'Unknown error')
                self.send_json_error(response.status_code, f"JSearch API error: {error_msg}")
                
        except Exception as e:
            self.send_json_error(500, f"Failed to search jobs: {str(e)}")
    
    def send_json_response(self, data):
        """Send JSON response"""
        response = json.dumps(data)
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Content-Length', len(response.encode('utf-8')))
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))
    
    def send_json_error(self, status_code, message):
        """Send JSON error response"""
        error_response = json.dumps({'error': message})
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Content-Length', len(error_response.encode('utf-8')))
        self.end_headers()
        self.wfile.write(error_response.encode('utf-8'))

class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def main():
    """Start the server"""
    try:
        httpd = ReuseAddrTCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler)
        print(f"Resume Analyzer server running at http://0.0.0.0:{PORT}/")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Server error: {e}")
    finally:
        try:
            httpd.shutdown()
            httpd.server_close()
        except:
            pass

if __name__ == "__main__":
    main()