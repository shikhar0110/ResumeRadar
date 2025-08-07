# Resume Skills Analyzer

## Overview

This is a client-side single-page web application that analyzes resumes to extract technical skills and find matching job opportunities. The application accepts PDF or DOCX resume uploads, uses Google's Gemini AI to extract skills from the resume text, and then searches for relevant jobs using the JSearch API. The entire process runs in the browser without any server-side components, providing a seamless and private experience for users looking to discover their skills and find job matches.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Frontend Architecture:**
- Single-page application built with vanilla HTML, CSS, and JavaScript
- No build tools or frameworks required - runs directly in the browser
- Responsive design with modern CSS including flexbox and grid layouts
- Font Awesome icons for enhanced visual appeal

**File Processing:**
- Client-side file parsing using specialized libraries:
  - PDF.js (v3.11.174) for PDF document parsing
  - Mammoth.js (v1.4.2) for DOCX document parsing
- File validation with 5MB size limit and format restrictions
- All file processing happens locally without server uploads

**AI Integration:**
- Google Gemini AI API for intelligent skill extraction from resume text
- Structured prompts designed to extract technical skills in comma-separated format
- Error handling for API failures and rate limiting

**Job Search Integration:**
- JSearch API (via RapidAPI) for finding relevant job opportunities  
- Skills-based job matching with configurable match thresholds (60% or higher)
- Automatic IP-based country detection for targeted job search
- Support for 12 major countries with manual override option
- Real-time job search based on extracted skills and detected/selected country

**User Experience Design:**
- Progressive loading states with visual feedback during processing
- Step-by-step progress indicators for multi-stage operations
- Automatic IP-based geolocation with visual feedback
- Optional manual country override with clean interface
- Clear error messaging and retry functionality
- Results displayed with job title, company, location, description, and application links
- Location-aware "no results" messaging for better user guidance

**Security Considerations:**
- API keys handled through environment variables or configuration
- All sensitive data processing happens client-side
- No data persistence or server-side storage

## External Dependencies

**CDN Libraries:**
- PDF.js (v3.11.174) - Client-side PDF parsing and text extraction
- Mammoth.js (v1.4.2) - DOCX document parsing and text extraction
- Font Awesome (v6.4.0) - Icon library for UI enhancement

**APIs:**
- Google Gemini AI API - Natural language processing for skill extraction from resume text
- JSearch API (RapidAPI) - Job search and matching service for finding relevant opportunities

**Package Dependencies:**
- @google/genai (v1.13.0) - Official Google Generative AI SDK for JavaScript