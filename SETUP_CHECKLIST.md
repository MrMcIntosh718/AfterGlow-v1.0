# ✅ Development Setup Checklist

## Pre-Installation (One-time)

- [ ] Install Git from https://git-scm.com/download/win
- [ ] Restart VS Code after Git installation  
- [ ] Configure git user.name and user.email once
- [ ] Download GitHub Desktop (optional): https://desktop.github.com/

## Initial Setup (First Time Only)

- [ ] Run quick-start.ps1 in ticket-site folder
- [ ] Review .gitignore to ensure it's correct
- [ ] Read SETUP_GUIDE.md for detailed instructions
- [ ] Test: Make a small change, commit, push successfully

## VS Code Configuration

- [ ] Install "Continue" extension for AI code completion
- [ ] (Optional) Install "GitHub Copilot" as alternative
- [ ] Set up linting rules in .vscode/settings.json
- [ ] Configure TypeScript path mappings if needed

## GitHub Desktop Setup (If using)

- [ ] Add local repository (ticket-site folder)
- [ ] Set up remote to your GitHub repo
- [ ] Sign in with GitHub account
- [ ] Test: Pull latest changes, push a commit

## Development Environment

- [ ] Run 
pm install to get dependencies
- [ ] Copy .env.example to .env.local
- [ ] Fill in API keys in .env.local (don't commit!)
- [ ] Start dev server: 
pm run dev
- [ ] Test the application works correctly

## AI Tools Setup

- [ ] Ensure LM Studio is installed and running
- [ ] Load a model in LM Studio
- [ ] Configure VS Code to use LM Studio for completions
- [ ] (Optional) Set up Cline extension if using it

## Project Understanding

- [ ] Read README.md to understand project purpose
- [ ] Review audit reports (SECURITY_AUDIT_REPORT.md, etc.)
- [ ] Understand feature proposals in FEATURE_PROPOSALS.md
- [ ] Familiarize with codebase structure

## Before First Commit

- [ ] Run 
pm run build to catch errors early
- [ ] Review all files that will be committed
- [ ] Ensure no sensitive data (API keys) are included
- [ ] Write clear commit message following guidelines

## Ongoing Best Practices

### Every Day
- [ ] Pull latest changes at start of session
- [ ] Run tests before committing if applicable
- [ ] Commit frequently with meaningful messages
- [ ] Push completed features to GitHub

### Before Pushing
- [ ] Build project successfully (
pm run build)
- [ ] Review all staged changes
- [ ] Check for sensitive data (no .env.local!)
- [ ] Write clear commit message

### Weekly
- [ ] Pull latest from main branch
- [ ] Address any merge conflicts promptly  
- [ ] Review and respond to PRs if you're a contributor
- [ ] Update dependencies: 
pm update (when appropriate)

## Post-Setup Verification Tests

After completing setup, verify everything works:

### Test 1: Git Operations
`ash
git status        # Should show current state
git add .         # Stage all files  
git commit -m "test"  # Create test commit
git push          # Push to GitHub
`

### Test 2: Development Server
`ash
npm run dev       # Start dev server
# Open http://localhost:3000 in browser
# Verify page loads without errors
`

### Test 3: AI Assistance  
- [ ] Try asking Continue/LM Studio for code completion
- [ ] Ask it to explain a complex function
- [ ] Request it to write a small utility function

### Test 4: Build Process
`ash
npm run build     # Should complete without errors
# If errors, fix them before committing
`

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Git not found" | Install Git from git-scm.com |
| Merge conflicts | Use GitHub Desktop visual diff to resolve |
| Build fails after pull | Run 
pm install to update deps |
| AI suggestions slow | Check LM Studio model is loaded |
| Push rejected | Pull latest changes first, then push |

## Resources

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Desktop Help**: https://docs.github.com/desktop  
- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **VS Code Extensions**: https://marketplace.visualstudio.com/vscode

---

*Checklist for Afterglow project setup - 2026-10-25*
