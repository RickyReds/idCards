# CLAUDE.md - AI Assistant Guide for idCards

**Last Updated:** 2025-11-16
**Repository:** RickyReds/idCards
**License:** MIT

## Repository Overview

### Purpose
This repository is for the **idCards** project - a system for ID card generation, management, and/or validation. The project is in its initial stages with foundational setup complete.

### Current State
- **Status:** New repository, initial setup phase
- **Current Branch:** `claude/claude-md-mi1i1eknt9diaq56-01P8tqfiYo6xAHz3tmPFnBS8`
- **Main Branch:** Not yet defined
- **License:** MIT License (Copyright 2025 RickyReds)
- **Existing Files:** LICENSE only

## Project Structure

### Recommended Directory Layout
```
idCards/
├── src/                    # Source code
│   ├── components/        # UI components (if web-based)
│   ├── services/          # Business logic and services
│   ├── models/            # Data models and schemas
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test data
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
├── public/                # Static assets (if web-based)
├── .github/               # GitHub workflows and templates
├── LICENSE                # MIT License
├── README.md              # Project documentation
├── CLAUDE.md              # This file - AI assistant guide
└── package.json           # Dependencies (if Node.js)
```

## Development Workflows

### Git Branch Strategy

**Current Development Branch:** `claude/claude-md-mi1i1eknt9diaq56-01P8tqfiYo6xAHz3tmPFnBS8`

**Branch Naming Conventions:**
- Feature branches: `feature/<feature-name>`
- Bug fixes: `bugfix/<bug-description>`
- Claude AI branches: `claude/claude-md-<session-id>`
- Hotfixes: `hotfix/<fix-description>`

**CRITICAL Git Requirements:**
1. Always develop on the designated branch
2. Claude branches MUST start with `claude/` and end with matching session ID
3. Use `git push -u origin <branch-name>` for pushing
4. Retry network failures up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
5. Never push to different branches without explicit permission

### Commit Message Guidelines

Follow conventional commit format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(card-generator): add QR code generation support

Implement QR code generation for ID cards using qrcode library.
Includes error handling and customizable size options.

Closes #123
```

```
fix(validation): correct date format validation

Fix validation logic to accept multiple date formats.
Previously only accepted YYYY-MM-DD format.
```

### Code Quality Standards

**General Principles:**
1. Write clean, readable, and maintainable code
2. Follow DRY (Don't Repeat Yourself) principle
3. Use meaningful variable and function names
4. Add comments for complex logic only
5. Keep functions small and focused (single responsibility)

**Security Considerations:**
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate all user inputs
- Prevent common vulnerabilities:
  - SQL injection
  - XSS (Cross-site scripting)
  - Command injection
  - CSRF (Cross-site request forgery)
  - Path traversal
- Follow OWASP Top 10 guidelines

**Performance:**
- Optimize for readability first, then performance
- Profile before optimizing
- Use appropriate data structures
- Avoid premature optimization

### Testing Strategy

**Test Coverage Goals:**
- Minimum 80% code coverage
- 100% coverage for critical paths (authentication, data validation, etc.)

**Test Types:**
1. **Unit Tests:** Test individual functions/methods
2. **Integration Tests:** Test component interactions
3. **E2E Tests:** Test complete user workflows
4. **Security Tests:** Test for vulnerabilities

**Testing Best Practices:**
- Write tests before or alongside code (TDD approach preferred)
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Keep tests independent and isolated

## AI Assistant Conventions

### When Starting a Task

1. **Understand the Request:**
   - Read the task description carefully
   - Identify if it's a question, implementation, or bug fix
   - Ask for clarification if requirements are ambiguous

2. **Use TodoWrite for Planning:**
   - For multi-step tasks (3+ steps), create a todo list
   - Break complex tasks into smaller, manageable items
   - Mark tasks as in_progress when working on them
   - Mark completed immediately after finishing

3. **Explore Before Implementing:**
   - Use Task tool with subagent_type=Explore for codebase exploration
   - Read relevant files to understand context
   - Check for existing similar implementations
   - Identify potential conflicts or dependencies

### Code Implementation Guidelines

**File Operations:**
- Always READ files before editing them
- Prefer EDITING existing files over creating new ones
- Use exact indentation from source files
- Never create documentation files unless explicitly requested

**Tool Usage:**
- Use specialized tools (Read, Edit, Write) instead of bash for file operations
- Run independent commands in parallel when possible
- Use Task tool for complex, multi-step operations
- Avoid using bash for grep, find, cat - use Grep, Glob, Read instead

**Communication:**
- Be concise and technical
- Output text directly to user, never use echo/printf
- No emojis unless explicitly requested
- Focus on facts and problem-solving

### Code Review Checklist

Before committing code, verify:
- [ ] Code follows project conventions
- [ ] No security vulnerabilities introduced
- [ ] No secrets or credentials committed
- [ ] Tests added/updated and passing
- [ ] Documentation updated if needed
- [ ] No unnecessary files created
- [ ] Commit message follows conventions
- [ ] Changes are on correct branch

### Typical Workflows

#### Adding a New Feature
1. Create todo list for the feature
2. Explore relevant parts of codebase
3. Design the implementation approach
4. Implement core functionality
5. Add tests
6. Update documentation
7. Commit with descriptive message
8. Push to designated branch

#### Fixing a Bug
1. Reproduce the bug
2. Identify root cause
3. Write failing test
4. Implement fix
5. Verify test passes
6. Check for similar issues
7. Commit and push

#### Refactoring Code
1. Ensure existing tests pass
2. Make incremental changes
3. Run tests after each change
4. Update tests if needed
5. Document changes
6. Commit and push

## Technology Stack

### To Be Determined
The specific technology stack has not yet been established. Consider these options based on project requirements:

**Backend Options:**
- Node.js + Express
- Python + Flask/FastAPI
- Go + Gin
- Java + Spring Boot

**Frontend Options:**
- React
- Vue.js
- Angular
- Vanilla JavaScript

**Database Options:**
- PostgreSQL
- MySQL
- MongoDB
- SQLite

**ID Card Specific Libraries:**
Consider libraries for:
- PDF generation (e.g., PDFKit, jsPDF)
- Image manipulation (e.g., Sharp, Pillow)
- QR code generation (e.g., qrcode, python-qrcode)
- Barcode generation
- OCR for ID scanning (e.g., Tesseract)

## Environment Setup

### Prerequisites
To be defined based on chosen technology stack.

### Installation Steps
```bash
# Clone the repository
git clone <repository-url>
cd idCards

# Checkout appropriate branch
git checkout <branch-name>

# Install dependencies (example for Node.js)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with appropriate values

# Run tests
npm test

# Start development server
npm run dev
```

## Common Commands

### Git Operations
```bash
# Create new branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote (with retry logic for network failures)
git push -u origin <branch-name>

# Pull latest changes
git pull origin <branch-name>

# Check status
git status
```

### Development Commands
To be added based on chosen technology stack.

## Documentation Standards

### Code Documentation
- Use JSDoc (JavaScript), docstrings (Python), or equivalent
- Document public APIs, complex algorithms, and non-obvious code
- Keep documentation up-to-date with code changes

### README.md Requirements
Should include:
- Project description and purpose
- Installation instructions
- Usage examples
- API documentation (if applicable)
- Contributing guidelines
- License information

### CHANGELOG.md
- Maintain changelog following Keep a Changelog format
- Document all notable changes
- Group changes by version and type

## Troubleshooting Guide

### Common Issues

**Git Push Failures (403 Error):**
- Ensure branch name starts with `claude/` and ends with matching session ID
- Verify network connectivity
- Retry with exponential backoff

**Network Timeouts:**
- Retry failed operations up to 4 times
- Use exponential backoff: 2s, 4s, 8s, 16s

**Build Failures:**
- Check dependency versions
- Clear cache and reinstall
- Review error logs carefully
- Verify environment variables are set

## Additional Resources

### Useful Links
- [GitHub Repository](https://github.com/RickyReds/idCards)
- [MIT License](LICENSE)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Getting Help
- Create an issue in the GitHub repository
- Check existing documentation
- Review commit history for context

## Notes for AI Assistants

### Critical Reminders
1. **Never create files unnecessarily** - always prefer editing existing files
2. **Read before editing** - always use Read tool before Edit/Write
3. **Use TodoWrite for complex tasks** - helps track progress and ensures completeness
4. **Security first** - check for vulnerabilities before committing
5. **Test thoroughly** - ensure changes don't break existing functionality
6. **Commit on correct branch** - verify branch before pushing
7. **No markdown files without request** - don't proactively create documentation

### Task Prioritization
1. Security and data integrity
2. Functionality correctness
3. Code quality and maintainability
4. Performance optimization
5. Documentation updates

### Best Practices
- Be objective and factual in responses
- Prioritize technical accuracy over validation
- Ask for clarification when uncertain
- Use parallel tool calls when possible
- Mark todos complete immediately after finishing
- Keep only ONE task in_progress at a time

---

**This document is a living guide and should be updated as the project evolves.**
