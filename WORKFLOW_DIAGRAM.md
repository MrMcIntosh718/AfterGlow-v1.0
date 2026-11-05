# 🔄 Integrated Development Workflow

`mermaid
graph TD
    A[VS Code] -->|Edit Code| B(Git)
    B -->|Track Changes| C[Github Desktop]
    C -->|Sync| D[GitHub.com]
    D -->|Pull Requests| E[Code Review]
    E -->|Approved| F[Merge to Main]
    A -.->|AI Assistance|. LM Studio
    A -.->|Auto-complete|. Continue Extension
`

## Tool Responsibilities

### VS Code (Primary Editor)
- ✅ Write and edit code
- ✅ View file changes in real-time  
- ✅ Run build commands (
pm run dev, 
pm run build)
- ✅ Debug applications
- ✅ Use extensions for AI assistance

### Git (Version Control)
- ✅ Track all changes to files
- ✅ Create snapshots (commits)
- ✅ Revert to previous versions
- ✅ Manage branches for features

### GitHub Desktop (Repository Manager)  
- ✅ Visual interface for Git operations
- ✅ Easy branch management
- ✅ Pull request creation and review
- ✅ Conflict resolution UI
- ✅ Push/pull with one click

### LM Studio / AI Tools (Intelligence Layer)
- ✅ Generate code snippets
- ✅ Suggest improvements
- ✅ Write tests automatically
- ✅ Debug and fix errors
- ✅ Document code

## Typical Development Flow

`
1. Open VS Code → Edit a file
2. Use AI assistant for help (optional)
3. Test changes with npm run dev
4. Commit changes in VS Code or GitHub Desktop
5. Push to GitHub when ready
6. Pull requests for team review
7. Merge after approval
`

## Connection Points

| From | To | Action |
|------|-----|--------|
| VS Code → Git | git add, git commit | Stage and commit changes |
| Git → GitHub Desktop | Push/Pull | Sync with remote repository |
| GitHub Desktop → GitHub.com | Web interface | View repo online, create PRs |
| LM Studio → VS Code | Extensions | AI code completion & suggestions |

## Best Practices

### Daily Workflow
1. **Morning**: Pull latest changes (git pull)
2. **During work**: Commit frequently with clear messages
3. **Before lunch**: Review and resolve any conflicts
4. **Afternoon**: Push completed features to GitHub
5. **Evening**: Check for PRs needing review

### Before Each Session
`ash
# Pull latest changes
git pull origin main

# Run tests if applicable
npm test

# Start development server
npm run dev
`

### Commit Strategy
- Commit often (every 15-30 minutes of focused work)
- Write clear, descriptive commit messages
- Group related changes in one commit
- Use conventional commits format: 	ype(scope): description

## Troubleshooting Common Issues

### "Git not found" 
→ Install Git from https://git-scm.com/download/win

### Merge conflicts
→ GitHub Desktop shows visual diff, edit to resolve

### Build errors after pull  
→ Run 
pm install to update dependencies

### AI suggestions not working
→ Check LM Studio is running and model loaded

---

*Workflow diagram for Afterglow project - 2026-10-25*
