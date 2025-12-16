# Clean Forward - Gmail Add-on

**Transform messy email threads into beautifully formatted, chronological conversations.**

Clean Forward is a Gmail add-on that strips quoted text, reply headers, and signatures from email threads, then presents them in a clean, timeline-style format. Perfect for forwarding long conversations without the clutter.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-yellow.svg)

## ✨ Features

- **Smart Quote Removal**: Automatically strips quoted text, reply headers, and email signatures
- **Timeline View**: Beautiful, chronological display with visual timeline dots
- **Participant Summary**: Shows all unique participants in the conversation
- **Attachment De-duplication**: Collects all attachments without duplicates
- **URL Linkification**: Automatically converts URLs to clickable links
- **Clean Formatting**: Preserves lists, structure, and intentional formatting
- **One-Click Access**: Opens draft directly from the add-on
- **Modern Design**: Professional, readable layout with consistent styling

## 📸 Screenshots

### Before
Cluttered email with quoted text, reply headers, and signatures taking up most of the space.

### After
Clean, timeline-style conversation showing only the important content from each participant.

## 🚀 Installation

### Prerequisites
- A Google account with Gmail access
- [clasp](https://github.com/google/clasp) installed (`npm install -g @google/clasp`)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/573dave/clean-forward-gmail.git
   cd clean-forward-gmail
   ```

2. **Login to clasp**
   ```bash
   clasp login
   ```

3. **Create a new Google Apps Script project**
   ```bash
   clasp create --type standalone --title "Clean Forward"
   ```

4. **Push the code**
   ```bash
   clasp push
   ```

5. **Deploy the add-on**
   ```bash
   clasp deploy
   ```

6. **Enable the add-on in Gmail**
   - Open the [Google Apps Script dashboard](https://script.google.com/)
   - Find your "Clean Forward" project
   - Click "Deploy" → "Test deployments"
   - Install the test deployment

### Alternative Installation (No clasp required)

If you prefer not to use clasp, you can set up the add-on directly in the browser:

1. **Create a new Apps Script project**
   - Visit [script.new](https://script.new) in your browser
   - This creates a new Google Apps Script project

2. **Rename the project**
   - Click "Untitled project" at the top
   - Rename it to "Clean Forward"

3. **Enable manifest file visibility**
   - Click the gear icon (Project Settings) in the left sidebar
   - Check the box "Show appsscript.json in editor"

4. **Add the main code file**
   - In the editor, you should see `Code.gs`
   - Copy the entire contents of [`src/Code.js`](src/Code.js) from this repository
   - Paste it into the `Code.gs` file, replacing any existing content
   - Save with `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)

5. **Update the manifest**
   - Click on `appsscript.json` in the left sidebar
   - Copy the entire contents of [`src/appsscript.json`](src/appsscript.json) from this repository
   - Paste it into the `appsscript.json` file, replacing any existing content
   - Save with `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)

6. **Deploy the add-on**
   - Click "Deploy" → "Test deployments" at the top right
   - Click "Install" to install the test deployment
   - Authorize the app when prompted (it needs Gmail access)

7. **Use the add-on**
   - Open [Gmail](https://mail.google.com)
   - Open any email thread
   - Look for the "Clean Forward" icon in the right sidebar
   - Click it to start using the add-on!

## 💡 Usage

1. **Open any email thread in Gmail**
2. **Click the "Clean Forward" icon** in the sidebar
3. **Click "Create clean forward draft"**
4. **Click "View Draft"** to open your cleaned-up email
5. **Edit and send** as needed!

The add-on will:
- Remove all quoted text and reply headers
- Sort messages chronologically (oldest to newest)
- Display each message in a clean card format
- Include a participant summary at the top
- Preserve and de-duplicate all attachments
- Convert URLs to clickable links

## 🏗️ Architecture

### Core Components

- **`buildAddOn(e)`**: Entry point that builds the Gmail sidebar UI
- **`createCleanForwardFromContext(e)`**: Main action handler for draft creation
- **`stripQuotedText_(plainBody)`**: Core text cleaning engine
- **`createCleanForwardDraftFromThread_(thread)`**: Processes thread and generates HTML
- **`cleanUnicodeArtifacts_(text)`**: Handles encoding issues and emoji
- **`collapseSoftLineBreaks_(text)`**: Preserves intentional formatting

### Text Processing Pipeline

1. **Unicode Normalization**: `cleanUnicodeArtifacts_`
2. **Plain Text Cleanup**: `cleanPlainTextArtifacts_`
3. **Quote Detection**: `stripQuotedText_` with 20+ regex patterns
4. **Structure Preservation**: `collapseSoftLineBreaks_`
5. **HTML Generation**: `textToHtml_` with URL linkification

## 🎨 Customization

### Styling

The HTML output uses inline styles for maximum compatibility. To customize the appearance, edit the CSS in `createCleanForwardDraftFromThread_()`:

- **Colors**: Modify the color hex codes (e.g., `#2563eb` for blue accent)
- **Fonts**: Change the `font-family` stack
- **Spacing**: Adjust `padding` and `margin` values
- **Timeline**: Customize the dot size and colors in `dotColor`

### Quote Detection

To add custom quote patterns, update the `REGEX_PATTERNS_` object:

```javascript
const REGEX_PATTERNS_ = {
  // Add your custom pattern
  customPattern: /^your regex here$/i,
  // ... existing patterns
};
```

Then add detection logic in `stripQuotedText_()`.

## 🔧 Development

### Project Structure

```
clean-forward-gmail/
├── src/
│   ├── Code.js             # Main add-on code
│   └── appsscript.json     # Add-on manifest
├── .clasp.json             # Clasp configuration
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
├── README.md               # This file
├── CLAUDE.md               # AI assistant guidelines
└── CONTRIBUTING.md         # Contribution guidelines
```

### Commands

```bash
# Push code to Google Apps Script
clasp push

# Pull latest from Google Apps Script
clasp pull

# Open project in browser
clasp open

# View logs
clasp logs
```

### Testing

1. Make changes to `src/Code.js`
2. Run `clasp push` to deploy
3. Test in Gmail by opening an email thread
4. Check logs with `clasp logs` if issues occur

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Improvement

- [ ] Support for inline replies (extracting text between quotes)
- [ ] Optional LLM integration for even smarter cleaning
- [ ] Customizable styling via user preferences
- [ ] Support for multiple languages
- [ ] Thread summarization for very long conversations
- [ ] Export to other formats (Markdown, PDF)

## 📋 Requirements

- Google Workspace account (personal Gmail works too)
- Gmail enabled
- Google Apps Script access

### OAuth Scopes

The add-on requires the following scopes:
- `gmail.addons.execute` - Run as a Gmail add-on
- `gmail.readonly` - Read email threads
- `gmail.compose` - Create draft emails

## 🐛 Known Issues

- Very long threads (100+ messages) may take a few seconds to process
- Some exotic email clients may have unrecognized quote patterns
- Attachments are de-duplicated by name+size (not content hash)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**573dave**

- GitHub: [@573dave](https://github.com/573dave)

## 🙏 Acknowledgments

- Built with [Google Apps Script](https://developers.google.com/apps-script)
- Deployed with [clasp](https://github.com/google/clasp)
- Developed with assistance from [Claude Code](https://claude.com/code)

## 📞 Support

If you encounter issues or have questions:

1. Check the [Issues](https://github.com/573dave/clean-forward-gmail/issues) page
2. Create a new issue with details about your problem
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshot if applicable
   - Logs from `clasp logs`

---

**Made with ❤️ for everyone tired of forwarding messy email threads**
