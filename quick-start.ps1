# Quick Start Script for Afterglow Development
# Run this after installing Git

cd "C:\Users\Professor X\Downloads\ticket-site"

# Configure git (run once)
git config --global user.name "Your Name" 2>&1 | Out-Null
git config --global user.email "your.email@example.com" 2>&1 | Out-Null

# Initialize repo if not already done
if (-not (Test-Path ".git")) {
    Write-Host "
Initializing git repository..."
    git init -m "Initial commit after audit"
} else {
    Write-Host "
Git repository already initialized."
}

# Stage all files
Write-Host "
Staging all changes..."
git add .

# Check status
Write-Host "
Current status:"
git status --short

# Commit if there are changes
 = git diff --cached --quiet 2>&1 | Out-String
if (-not ) {
    Write-Host "
No new changes to commit."
} else {
    Write-Host "
Committing changes..."
    git commit -m "Audit complete: Added rate limiting, input validation utilities, and comprehensive reports"
}

Write-Host "
=== Ready for development! ===" 
Write-Host "Next: Open in VS Code or use GitHub Desktop"
