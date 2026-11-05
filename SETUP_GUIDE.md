# 🎯 Complete Development Workflow Setup Guide

This guide will connect GitHub Desktop, VS Code, Git, and LM Studio for an optimized workflow.

---

## Prerequisites Installation

### 1. Install Git (Required)

**Download:** https://git-scm.com/download/win

**Install Steps:**
1. Download the installer
2. Run it with default settings
3. Restart VS Code after installation

**Verify Installation:**
`powershell
git --version
# Should show: git version 2.x.x
`

### 2. Install GitHub Desktop (Optional but Recommended)

**Download:** https://desktop.github.com/

**Why use it?**
- Visual interface for branches, pull requests
- Easy conflict resolution
- Syncs with VS Code automatically

---

## Configuration Steps (Do Once)

### Step 1: Configure Git User Info

Open PowerShell and run:
`powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
`

### Step 2: Initialize Repository for ticket-site

`powershell
cd "C:\Users\Professor X\Downloads\ticket-site"
git init -m "Initial commit after audit"
git add .
git commit -m "Audit complete with security utilities and feature proposals"
`

### Step 3: Connect to GitHub (Choose One Method)

#### Option A: Using GitHub Desktop

1. Open GitHub Desktop
2. File → Add Local Repository
3. Select 	icket-site folder
4. Configure repository name, branch (main)
5. Repository → Set Up Remote
6. Enter your GitHub repo URL or create new one
7. Sign in when prompted

#### Option B: Using VS Code Built-in Git

1. Open ticket-site in VS Code
2. Click Source Control icon (bottom-left)
3. Commit changes with message
4. Settings → Git → GitHub
5. Sign in to GitHub
6. Create new repository or connect existing one

---

## Daily Workflow

### Morning: Pull Latest Changes

**GitHub Desktop:**
- Repository → Fetch & Merge

**VS Code:**
`ash
git pull origin main
`

### During Development

1. **Edit code** in VS Code (or your preferred editor)
2. **Use AI assistance** from LM Studio or Cline for:
   - Code generation
   - Bug fixes  
   - Code reviews
3. **Test changes** by running 
pm run dev

### Before Committing

1. Run build to catch errors:
`ash
npm run build
`

2. Review changes in Source Control panel (VS Code) or GitHub Desktop

3. Write clear commit message following conventional commits:
   - eat: New feature
   - ix: Bug fix
   - docs: Documentation
   - efactor: Code restructuring
   - chore: Maintenance

### Commit & Push

**GitHub Desktop:**
- Click "Commit to main"
- Write commit message
- Click "Push origin"

**VS Code:**
`ash
git add .
git commit -m "feat: implement event wishlists feature"
git push origin main
`

---

## LM Studio Integration

### VS Code Extensions

Install these extensions in VS Code:

1. **Continue** (AI code completion)
2. **LM Studio** (if available)
3. **GitHub Copilot** (optional alternative)

### Configure AI Assistant

Create .vscode/settings.json:
`json
{
    "continue.selectedModel": "your-lm-studio-model",
    "continue.enable": true,
    "editor.tabSize": 2,
    "typescript.tsdk": "node_modules/typescript/lib"
}
`

### Using AI for Development

**Prompt examples:**
- "Add loading states to EventResults component"
- "Fix TypeScript error in lib/itinerary.ts"
- "Write unit tests for search functionality"
- "Refactor this function to be more readable"

---

## Cline Integration (If using)

Cline is an AI-powered development assistant. Configure it to:

1. **Review code changes** before committing
2. **Suggest improvements** during coding
3. **Write tests** for new features
4. **Debug issues** by analyzing error messages

---

## Best Practices

### Commit Messages

✅ Good: eat: add event wishlists with sharing  
❌ Bad: ixed stuff

### Branch Strategy

`ash
# Feature branches
git checkout -b feature/event-wishlists

# Bug fixes  
git checkout -b fix/typo-in-hero-section

# Always merge to main before pushing
git checkout main
git pull origin main
git merge feature/event-wishlists
git push origin main
`

### Before Pushing

1. Run 
pm run build to catch errors
2. Review all staged changes
3. Ensure no sensitive data committed (check .env.local)
4. Write clear commit message

---

## Troubleshooting

### "Git not found" Error

**Solution:** Install Git from https://git-scm.com/download/win, then restart VS Code

### "Permission denied" Errors

`powershell
# Run PowerShell as Administrator
git config --global core.fileMode false
git config --global core.autocrlf input
`

### Merge Conflicts

1. GitHub Desktop will show conflicts visually
2. Edit conflicting files to resolve
3. Mark as resolved in GitHub Desktop
4. Complete the push

---

## Project Structure After Setup

`
ticket-site/
├── .git/                    # Git repository (created after init)
├── .gitignore               # Created - excludes node_modules, etc.
├── README.md                # Updated with setup instructions
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript config
├── next.config.ts           # Next.js configuration
├── lib/
│   ├── ratelimit.ts         # NEW - Rate limiting utility
│   ├── input-validation.ts  # NEW - Input validation utilities
│   └── ...                  # Other library files
├── app/                     # Next.js app directory
├── components/              # React components
└── ...                      # Other project files
`

---

## Quick Reference Commands

### Daily Workflow

`ash
# Pull latest changes
git pull origin main

# Stage all changes
git add .

# Commit with message
git commit -m "Your message here"

# Push to GitHub
git push origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Switch branches
git checkout main
`

### Development Commands

`ash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
`

---

## Next Steps After Setup

1. ✅ Install Git and configure user info
2. ✅ Initialize repository with audit changes
3. ✅ Connect to GitHub via Desktop or VS Code
4. ✅ Test workflow: make small change → commit → push
5. ✅ Set up AI assistant (LM Studio/Continue)
6. ✅ Start implementing feature proposals!

---

## Support Resources

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Desktop Help:** https://docs.github.com/desktop
- **Next.js Docs:** https://nextjs.org/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

*Setup guide created for Afterglow project - 2026-10-25*
