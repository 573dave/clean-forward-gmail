# Contributing to Clean Forward

Thank you for your interest in contributing to Clean Forward! This document provides guidelines and instructions for contributing.

## 🎯 How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue with:

- **Clear title**: Summarize the problem
- **Description**: Detailed explanation of the issue
- **Steps to reproduce**: How to recreate the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Logs**: Output from `clasp logs`
- **Environment**: Gmail account type (personal/workspace)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please create an issue with:

- **Clear title**: Describe the enhancement
- **Use case**: Why is this needed?
- **Proposed solution**: How might it work?
- **Alternatives**: Other approaches considered
- **Examples**: Screenshots or mockups if applicable

### Pull Requests

We love pull requests! Here's how to submit one:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly** in a real Gmail environment
5. **Follow the code style** (see below)
6. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
7. **Push to your branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

## 📝 Code Style Guidelines

### JavaScript (ES6+)

- Use `const` and `let`, not `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Add JSDoc comments for all functions
- Keep functions focused and single-purpose
- Use descriptive variable names

### Example

```javascript
/**
 * Processes an email message and extracts clean content.
 *
 * @param {GmailMessage} message - The Gmail message to process
 * @returns {string} Cleaned message content
 */
function processMessage(message) {
  const body = message.getPlainBody();
  const cleaned = stripQuotedText_(body);
  return cleaned;
}
```

### Naming Conventions

- **Public functions**: `camelCase` (e.g., `buildAddOn`)
- **Private functions**: `camelCase_` with trailing underscore (e.g., `stripQuotedText_`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `REGEX_PATTERNS_`)
- **Variables**: `camelCase` (e.g., `messageBody`)

### Comments

- Add JSDoc comments for all functions
- Include `@param`, `@returns`, and `@private` tags
- Explain complex logic with inline comments
- Keep comments up-to-date with code changes

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test your changes with:

- [ ] Single message thread
- [ ] Multi-message thread (5+ messages)
- [ ] Thread with attachments
- [ ] Thread with quoted text
- [ ] Thread with different email clients (Gmail, Outlook, Apple Mail)
- [ ] Thread with URLs and phone numbers
- [ ] Thread with special characters and emoji
- [ ] Very long thread (20+ messages)

### Testing Steps

1. Push your changes: `clasp push`
2. Open Gmail and select a test thread
3. Click the Clean Forward add-on
4. Create a draft and verify:
   - Quoted text is removed
   - Formatting is preserved
   - Attachments are included
   - URLs are clickable
   - No errors in logs (`clasp logs`)

## 🏗️ Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/573dave/clean-forward-gmail.git
   cd clean-forward-gmail
   ```

2. **Install clasp** (if not already installed)
   ```bash
   npm install -g @google/clasp
   ```

3. **Login to clasp**
   ```bash
   clasp login
   ```

4. **Create a test project**
   ```bash
   clasp create --type standalone --title "Clean Forward Dev"
   ```

5. **Push and test**
   ```bash
   clasp push
   clasp open
   ```

## 📂 Project Structure

```
clean-forward-gmail/
├── src/
│   ├── Code.js             # Main add-on code (all functions here)
│   └── appsscript.json     # Manifest with OAuth scopes and settings
├── .clasp.json             # Clasp configuration (Git-ignored)
├── .gitignore              # Files to ignore in Git
├── LICENSE                 # MIT License
├── README.md               # Main documentation
├── CLAUDE.md               # Guidelines for AI assistants
└── CONTRIBUTING.md         # This file
```

## 🎨 Areas for Contribution

### High Priority

- **Quote Detection**: Improve regex patterns for edge cases
- **Performance**: Optimize for very long threads
- **Error Handling**: Better user-facing error messages
- **Testing**: Automated test suite

### Medium Priority

- **Inline Replies**: Extract text between quoted blocks
- **Customization**: User preferences for styling
- **Internationalization**: Support for non-English emails
- **Mobile**: Optimize for mobile Gmail app

### Low Priority

- **Export Formats**: Markdown, PDF options
- **Thread Summary**: AI-powered summarization
- **Analytics**: Usage statistics (privacy-respecting)

## 🔍 Code Review Process

All PRs will be reviewed for:

1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it readable and maintainable?
3. **Performance**: Does it impact processing time?
4. **Security**: Are there any vulnerabilities?
5. **Documentation**: Are comments and docs updated?
6. **Testing**: Has it been tested thoroughly?

## 📋 Commit Message Guidelines

Use clear, descriptive commit messages:

- **feat**: New feature (`feat: add inline reply detection`)
- **fix**: Bug fix (`fix: handle Outlook separator lines`)
- **docs**: Documentation (`docs: update README with screenshots`)
- **style**: Formatting (`style: add missing JSDoc comments`)
- **refactor**: Code restructure (`refactor: simplify quote detection logic`)
- **test**: Testing (`test: add test cases for edge cases`)
- **chore**: Maintenance (`chore: update dependencies`)

## ❓ Questions?

If you have questions about contributing:

1. Check existing [Issues](https://github.com/573dave/clean-forward-gmail/issues)
2. Create a new issue with the "question" label
3. Be specific about what you need help with

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## 🙏 Recognition

Contributors will be recognized in:

- README.md acknowledgments
- Release notes
- Commit history

Thank you for making Clean Forward better! 🎉
