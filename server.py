#!/usr/bin/env python3
import http.server
import socketserver
import os
import re
from urllib.parse import urlparse

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