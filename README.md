AI Media Forensics Platform
A full-stack forensic system for detecting AI-generated or manipulated images — with visual explanations instead of black-box predictions.
Upload an image, and the platform analyzes it using multiple forensic signals, produces suspicion heatmaps, assigns a risk score, and generates an investigation-ready report.

What It Does
• Detects potential AI-generated imagery
• Runs frequency, noise, and patch-based analysis
• Highlights suspicious regions using heatmaps
• Shows a forensic timeline of processing stages
• Exports reports for documentation
• Stores case history for review

Architecture
React Dashboard → FastAPI API → Forensic Detectors → Risk Scoring → Heatmaps & Reports

Tech Stack
Frontend: React, Tailwind, Vite
Backend: FastAPI, OpenCV, NumPy
Deployment: Render (API), Netlify (UI)
DevOps: GitHub + CI/CD

Why This Project
Most detection tools just say “real” or “fake.”
This platform focuses on explainability — giving visual and technical evidence that helps humans make the final call.
