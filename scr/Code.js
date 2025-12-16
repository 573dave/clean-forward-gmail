/**
 * Clean Forward - Gmail Add-on
 *
 * A Gmail add-on that creates clean, readable forwarded email threads by:
 * - Removing quoted text, reply headers, and signatures
 * - Displaying messages in chronological order
 * - Presenting conversations in a beautiful timeline format
 * - Preserving all attachments with de-duplication
 * - Converting URLs to clickable links
 *
 * @author 573dave
 * @license MIT
 * @version 2.0.0
 */

/**
 * Main entry point for the Gmail add-on.
 * Called by Gmail when the add-on sidebar is opened. This function builds
 * the initial UI card with a button to create a clean forward draft.
 *
 * @param {Object} e - The event object from Gmail containing context information
 * @returns {Card[]} Array of Card objects to display in the Gmail sidebar
 */
function buildAddOn(e) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Clean Forward')
        .setSubtitle('Generate a readable conversation summary')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(
              'Click the button below to create a new draft with this thread ' +
              'cleaned up into a chronological, readable conversation.'
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Create clean forward draft')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('createCleanForwardFromContext')
            )
        )
    )
    .build();

  return [card];
}

/**
 * Action handler for the "Create clean forward draft" button.
 * Retrieves the current Gmail thread, processes all messages to remove
 * quoted text, and creates a draft with a clean, timeline-style layout.
 * Shows a success card with a "View Draft" button upon completion.
 *
 * @param {Object} e - The event object from Gmail containing threadId and other context
 * @returns {ActionResponse} Response object to update the UI and show notifications
 */
function createCleanForwardFromContext(e) {
  try {
    const thread = getCurrentThreadFromEvent_(e);
    if (!thread) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification().setText('No thread found. Open an email and try again.')
        )
        .build();
    }

    const result = createCleanForwardDraftFromThread_(thread);

    // Create a success card with a button to view the draft
    const responseCard = CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('Draft Created!')
          .setSubtitle(result.subject)
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('Your clean forward draft has been created successfully.')
          )
          .addWidget(
            CardService.newTextButton()
              .setText('View Draft')
              .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
              .setOpenLink(
                CardService.newOpenLink()
                  .setUrl(result.draftUrl)
                  .setOpenAs(CardService.OpenAs.FULL_SIZE)
                  .setOnClose(CardService.OnClose.NOTHING)
              )
          )
          .addWidget(
            CardService.newTextButton()
              .setText('Create Another')
              .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('resetToMainCard')
              )
          )
      )
      .build();

    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().pushCard(responseCard)
      )
      .setNotification(
        CardService.newNotification()
          .setText(`Draft created: ${result.subject}`)
          .setType(CardService.NotificationType.INFO)
      )
      .build();

  } catch (err) {
    console.error(err);
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText('Error creating draft. Check Logs.')
          .setType(CardService.NotificationType.ERROR)
      )
      .build();
  }
}

/**
 * Resets the UI back to the main card.
 * Called when user clicks "Create Another" button after creating a draft.
 *
 * @param {Object} e - The event object (not used)
 * @returns {ActionResponse} Response to navigate back to the previous card
 */
function resetToMainCard(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation().popCard()
    )
    .build();
}

/**
 * Extracts the Gmail thread from the add-on event object.
 *
 * @private
 * @param {Object} e - Event object containing gmail.threadId
 * @returns {GmailThread|null} The Gmail thread object or null if not found
 */
function getCurrentThreadFromEvent_(e) {
  if (!e || !e.gmail || !e.gmail.threadId) return null;
  return GmailApp.getThreadById(e.gmail.threadId);
}

/**
 * Processes a Gmail thread and creates a clean forward draft.
 *
 * This is the main processing function that:
 * 1. Retrieves all messages from the thread
 * 2. Sorts them chronologically (oldest to newest)
 * 3. Strips quoted text and reply headers from each message
 * 4. Builds a beautiful HTML timeline display
 * 5. De-duplicates attachments across all messages
 * 6. Creates a draft email with the cleaned content
 *
 * @private
 * @param {GmailThread} thread - The Gmail thread to process
 * @returns {Object} Object containing {subject: string, draftUrl: string}
 */
function createCleanForwardDraftFromThread_(thread) {
  const messages = thread.getMessages();
  if (!messages || messages.length === 0) return null;

  // Sort messages oldest -> newest
  const sortedMessages = messages.slice().sort((a, b) => a.getDate() - b.getDate());

  const htmlParts = [];

  // Collect all unique attachments across messages
  const allAttachments = [];
  const seenAttachmentKeys = {}; // name|size -> true

  // Extract unique participants for summary
  const participants = extractParticipants_(sortedMessages);
  const participantSummary = participants.length > 1
    ? `<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;">
         Participants: ${sanitizeHtml_(participants.join(', '))}
         (${participants.length} ${participants.length === 1 ? 'person' : 'people'})
       </p>`
    : '';

  // Build the HTML header with modern styling
  htmlParts.push(`
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      background:#f8fafc;
      padding:24px 16px;
      margin:0;
      line-height:1.5;
    ">
      <div style="max-width:760px;margin:0 auto;">
        <div style="
          background:#ffffff;
          border-radius:12px;
          padding:20px 24px;
          margin-bottom:20px;
          box-shadow:0 1px 3px rgba(0,0,0,0.1);
        ">
          <h2 style="
            margin:0 0 4px 0;
            font-size:22px;
            font-weight:600;
            color:#111827;
            letter-spacing:-0.01em;
          ">Conversation Summary</h2>
          <p style="
            margin:0;
            font-size:14px;
            color:#6b7280;
            line-height:1.4;
          ">Chronological view of this email thread (oldest to newest).</p>
          ${participantSummary}
        </div>
  `);

  // Process each message
  for (let i = 0; i < sortedMessages.length; i++) {
    const msg = sortedMessages[i];
    const fromRaw = msg.getFrom();
    const date = msg.getDate();
    const subject = msg.getSubject() || '';
    const plainBody = msg.getPlainBody();

    // Parse email address for better display
    const fromParsed = parseEmailFrom_(fromRaw);
    const fromDisplay = fromParsed.name || fromParsed.email;

    // Clean the message body
    const cleanedBody = stripQuotedText_(plainBody);
    let safeHtmlBody = textToHtml_(cleanedBody);

    // Check for attachments
    const msgAttachments = msg.getAttachments({
      includeInlineImages: false,
      includeAttachments: true
    });
    const hasAttachments = msgAttachments && msgAttachments.length > 0;

    // Handle empty messages gracefully
    if (!safeHtmlBody) {
      safeHtmlBody = hasAttachments
        ? '<span style="color:#9ca3af;font-style:italic;">(no new text; see attachments)</span>'
        : '<span style="color:#9ca3af;font-style:italic;">(forwarded without adding new content)</span>';
    }

    const attachmentsHtml = buildAttachmentsHtml_(msg, allAttachments, seenAttachmentKeys);

    const isLatest = i === sortedMessages.length - 1;
    const dotColor = isLatest ? '#2563eb' : '#9ca3af';

    // Build the timeline card for this message
    htmlParts.push(`
      <div style="
        display:flex;
        align-items:flex-start;
        margin-bottom:16px;
      ">
        <!-- Timeline column with dot and connecting line -->
        <div style="
          width:32px;
          display:flex;
          justify-content:center;
          flex-shrink:0;
        ">
          <div style="
            position:relative;
            width:4px;
            background:#e5e7eb;
            border-radius:999px;
            min-height:32px;
          ">
            ${i === 0 ? '' : `
              <div style="
                position:absolute;
                top:-16px;
                left:50%;
                transform:translateX(-50%);
                width:2px;
                height:16px;
                background:#e5e7eb;
              "></div>
            `}
            <div style="
              position:absolute;
              top:16px;
              left:50%;
              transform:translate(-50%,-50%);
              width:12px;
              height:12px;
              border-radius:999px;
              background:${dotColor};
              box-shadow:0 0 0 3px #f8fafc;
              border:2px solid #ffffff;
            "></div>
          </div>
        </div>

        <!-- Message card -->
        <div style="flex:1;margin-left:12px;">
          <div style="
            background:#ffffff;
            border-radius:10px;
            padding:14px 16px;
            box-shadow:0 1px 3px rgba(0,0,0,0.08);
            border:1px solid ${isLatest ? '#dbeafe' : '#f3f4f6'};
            ${isLatest ? 'background:linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);' : ''}
          ">
            <div style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              margin-bottom:8px;
            ">
              <div style="flex:1;min-width:0;">
                <div style="
                  font-size:14px;
                  font-weight:600;
                  color:#111827;
                ">${sanitizeHtml_(fromDisplay)}</div>
              </div>
              <div style="
                font-size:11px;
                color:#9ca3af;
                white-space:nowrap;
                margin-left:12px;
                flex-shrink:0;
              ">${sanitizeHtml_(formatDate_(date))}</div>
            </div>
            <div style="
              font-size:14px;
              color:#374151;
              line-height:1.6;
              white-space:pre-wrap;
              word-wrap:break-word;
              overflow-wrap:break-word;
            ">${safeHtmlBody}</div>
            ${attachmentsHtml}
          </div>
        </div>
      </div>
    `);
  }

  htmlParts.push('</div></div>'); // close containers

  const finalHtml = htmlParts.join('');

  const threadSubject = sortedMessages[0].getSubject() || 'Forwarded Conversation';
  const draftSubject = `FWD: ${threadSubject}`;

  const draftOptions = {
    htmlBody: finalHtml
  };
  if (allAttachments.length > 0) {
    draftOptions.attachments = allAttachments;
  }

  // Create draft and get the message ID for deep linking
  const draft = GmailApp.createDraft('', draftSubject, 'This email requires HTML view.', draftOptions);
  const messageId = draft.getMessage().getId();
  const draftUrl = `https://mail.google.com/mail/u/0/#drafts?compose=${messageId}`;

  return {
    subject: draftSubject,
    draftUrl: draftUrl
  };
}

/**
 * Formats a date in a human-readable way.
 * Uses relative formatting for recent dates (Today, Yesterday, day names)
 * and full dates for older messages.
 *
 * @private
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "Today 2:30 PM", "Wed 4:15 PM", "Dec 15 3:00 PM")
 */
function formatDate_(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays === 0) {
    return `Today ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    }) + ' ' + timeStr;
  }
}

/**
 * Extracts unique participant names from an array of messages.
 * Parses the "From" field of each message and de-duplicates by name.
 *
 * @private
 * @param {GmailMessage[]} messages - Array of Gmail messages
 * @returns {string[]} Array of unique participant names
 */
function extractParticipants_(messages) {
  const seen = {};
  const participants = [];

  for (const msg of messages) {
    const fromRaw = msg.getFrom();
    const parsed = parseEmailFrom_(fromRaw);
    const name = parsed.name || parsed.email;

    if (!seen[name]) {
      seen[name] = true;
      participants.push(name);
    }
  }

  return participants;
}

/**
 * Parses an email "From" field into name and email components.
 * Handles formats like "John Doe <john@example.com>" and plain emails.
 *
 * @private
 * @param {string} fromString - The raw "From" field from a Gmail message
 * @returns {Object} Object with {name: string, email: string}
 */
function parseEmailFrom_(fromString) {
  if (!fromString) return { name: '', email: '' };

  const match = fromString.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim()
    };
  }

  // If no angle brackets, it's just an email
  return { name: fromString.trim(), email: fromString.trim() };
}

/**
 * Pre-compiled regex patterns for email parsing and quote detection.
 * These patterns are used to identify quoted text, reply headers, signatures,
 * and other email artifacts that should be removed from the cleaned output.
 *
 * @constant
 * @type {Object.<string, RegExp>}
 */
const REGEX_PATTERNS_ = {
  // Reply header: "On Mon, Dec 15, 2025 at 2:09 PM"
  replyHeaderDate: /^on\s+\w+,?\s+\w+\s+\d+,?\s+\d{4}/i,
  // Alternative reply format: "On Dec 15, 2025" or "On 12/15/2025"
  replyHeaderAlt: /^on\s+(\w+\s+\d+,?\s+\d{4}|\d+\/\d+\/\d+)/i,
  // Gmail forwarded message
  gmailForward: /^[-]{10}\s*forwarded message\s*[-]{10}$/i,
  // Outlook forwarded
  outlookForward: /^[-_]{10,}$/,
  // iOS Mail
  iosForward: /^begin forwarded message:$/i,
  // Original message separator
  originalMessage: /^[-]{5,}\s*original message\s*[-]{5,}$/i,
  // Gmail collapsed text
  gmailCollapsed: /^\.{3}$/,
  // Multiple header pattern (From: + To: or From: + Date:)
  fromHeader: /^from:\s*.+@/i,
  toHeader: /^to:\s*.+@/i,
  ccHeader: /^cc:\s*.+@/i,
  subjectHeader: /^subject:\s*/i,
  dateHeader: /^date:\s*/i,
  sentHeader: /^sent:\s*/i,
  // Signature separators
  sigSeparator: /^(--|__|---|\*\*\*|___|-- )$/,
  // Mobile signatures
  mobileSig: /^(sent from my |get outlook for |sent via |download outlook)/i,
  // List markers
  listMarker: /^(\s*[-*+•]\s+|\s*\d+[\.)]\s+)/,
  // Disclaimer patterns
  disclaimer: /^(for intended recipients only|confidentiality notice|this message \(including any attachments\)|this e-mail and any attachments)/i,
  // "wrote:" by itself on a line
  wroteAlone: /^.*wrote:\s*$/i,
  // Email-like line with name and email
  emailLine: /^[^<]+<[^@]+@[^>]+>\s*(wrote|said|replied)?\s*:?\s*$/i,
  // Outlook style separator
  outlookSeparator: /^_{20,}$/,
  // "From:" followed by email without @
  fromWithoutAt: /^from:\s*[^@]*$/i
};

/**
 * Strips quoted text, reply headers, and disclaimers from email body.
 *
 * This is the core text cleaning function that removes:
 * - Quoted text (lines starting with >)
 * - Reply headers ("On ... wrote:", "From: ... Sent: ...")
 * - Email signatures (-- separator, mobile signatures)
 * - Forwarded message markers
 * - Legal disclaimers and confidentiality notices
 * - Empty quoted replies
 *
 * The function uses sophisticated pattern matching to avoid false positives
 * while being aggressive about removing unwanted content.
 *
 * @private
 * @param {string} plainBody - Raw plain text body from Gmail message
 * @returns {string} Cleaned message body with only new content
 */
function stripQuotedText_(plainBody) {
  if (!plainBody) return '';

  // Clean unicode artifacts and plain text conversion issues
  let text = cleanUnicodeArtifacts_(plainBody);
  text = cleanPlainTextArtifacts_(text);

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const cleanedLines = [];
  let consecutiveHeaderCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Skip empty lines but don't break on them
    if (trimmed === '') {
      cleanedLines.push(line);
      consecutiveHeaderCount = 0;
      continue;
    }

    // Disclaimers / legal footers (only after some real content)
    if (cleanedLines.length > 5 && REGEX_PATTERNS_.disclaimer.test(lower)) {
      break;
    }

    // Gmail collapsed text indicator
    if (REGEX_PATTERNS_.gmailCollapsed.test(trimmed)) break;

    // Gmail forwarded message header
    if (REGEX_PATTERNS_.gmailForward.test(trimmed)) break;

    // iOS Mail forwarded message
    if (REGEX_PATTERNS_.iosForward.test(trimmed)) break;

    // Original message separator
    if (REGEX_PATTERNS_.originalMessage.test(trimmed)) break;

    // Outlook underscore separator
    if (REGEX_PATTERNS_.outlookSeparator.test(trimmed)) break;

    // Long separator lines (Outlook style) - but only after content
    if (cleanedLines.length > 5 && REGEX_PATTERNS_.outlookForward.test(trimmed)) {
      break;
    }

    // "wrote:" by itself or with minimal text (strong indicator)
    if (REGEX_PATTERNS_.wroteAlone.test(lower) && trimmed.length < 100) {
      break;
    }

    // Email-like line: "John Doe <john@example.com> wrote:"
    if (REGEX_PATTERNS_.emailLine.test(trimmed)) {
      break;
    }

    // Reply header "On Mon, Dec 15, 2025 at 2:09 PM ... wrote:"
    if (REGEX_PATTERNS_.replyHeaderDate.test(lower) || REGEX_PATTERNS_.replyHeaderAlt.test(lower)) {
      const hasWrote = lower.includes('wrote:');
      const ahead1 = (i + 1 < lines.length) ? lines[i + 1].trim().toLowerCase() : '';
      const ahead2 = (i + 2 < lines.length) ? lines[i + 2].trim().toLowerCase() : '';
      const ahead3 = (i + 3 < lines.length) ? lines[i + 3].trim().toLowerCase() : '';

      // Check if "wrote:" appears in the current line or next 3 lines
      if (hasWrote || ahead1.includes('wrote:') || ahead2.includes('wrote:') || ahead3.includes('wrote:')) {
        break;
      }

      // Also break if we see email headers after this line
      if (REGEX_PATTERNS_.fromHeader.test(ahead1) || REGEX_PATTERNS_.fromHeader.test(ahead2)) {
        break;
      }
    }

    // Email headers - require multiple consecutive headers OR Sent: header
    let isHeader = false;
    if (cleanedLines.length > 3) {
      // "Sent:" is a strong indicator it's an email header block
      if (REGEX_PATTERNS_.sentHeader.test(trimmed)) {
        const behind1 = (i > 0) ? lines[i - 1].trim().toLowerCase() : '';
        const ahead1 = (i + 1 < lines.length) ? lines[i + 1].trim().toLowerCase() : '';

        // If Sent: is surrounded by other headers, it's definitely a header block
        if (REGEX_PATTERNS_.fromHeader.test(behind1) ||
            REGEX_PATTERNS_.fromHeader.test(ahead1) ||
            REGEX_PATTERNS_.toHeader.test(ahead1) ||
            REGEX_PATTERNS_.subjectHeader.test(ahead1)) {
          // Remove previous line if it was a header
          if (REGEX_PATTERNS_.fromHeader.test(behind1)) {
            cleanedLines.pop();
          }
          break;
        }
      }

      if (REGEX_PATTERNS_.fromHeader.test(trimmed) ||
          REGEX_PATTERNS_.toHeader.test(trimmed) ||
          REGEX_PATTERNS_.ccHeader.test(trimmed) ||
          REGEX_PATTERNS_.subjectHeader.test(trimmed) ||
          REGEX_PATTERNS_.dateHeader.test(trimmed)) {
        consecutiveHeaderCount++;
        isHeader = true;

        // Only break if we see 2+ consecutive headers
        if (consecutiveHeaderCount >= 2) {
          // Remove the first header line we added
          cleanedLines.pop();
          break;
        }
      }
    }

    if (!isHeader) {
      consecutiveHeaderCount = 0;
    }

    // Skip quoted lines (starting with >)
    if (trimmed.startsWith('>')) continue;

    // Signature separators (only after substantial content)
    if (cleanedLines.length > 5) {
      if (REGEX_PATTERNS_.sigSeparator.test(trimmed)) break;
      if (REGEX_PATTERNS_.mobileSig.test(trimmed)) break;
    }

    cleanedLines.push(line);
  }

  // Trim trailing blank lines
  while (cleanedLines.length && cleanedLines[cleanedLines.length - 1].trim() === '') {
    cleanedLines.pop();
  }

  // Collapse soft line breaks while preserving structure
  const collapsed = collapseSoftLineBreaks_(cleanedLines.join('\n'));
  return collapsed.trim();
}

/**
 * Converts plain text to HTML with proper escaping and linkification.
 * Escapes HTML characters, converts URLs to clickable links, and
 * converts line breaks to <br> tags.
 *
 * @private
 * @param {string} text - Plain text to convert
 * @returns {string} HTML-safe text with clickable links
 */
function textToHtml_(text) {
  if (!text) return '';

  let escaped = sanitizeHtml_(text);

  // Linkify URLs
  escaped = linkifyUrls_(escaped);

  // Convert line breaks to <br> but preserve paragraph structure
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

/**
 * Converts plain HTTP(S) URLs to clickable HTML links.
 * Handles trailing punctuation intelligently.
 *
 * @private
 * @param {string} text - Text that may contain URLs
 * @returns {string} Text with URLs converted to <a> tags
 */
function linkifyUrls_(text) {
  if (!text) return '';

  // Match URLs (http, https)
  const urlPattern = /(https?:\/\/[^\s<]+)/g;

  return text.replace(urlPattern, (url) => {
    // Remove trailing punctuation that's not part of URL
    const cleanUrl = url.replace(/[.,;!?]+$/, '');
    const trailing = url.substring(cleanUrl.length);

    return `<a href="${cleanUrl}" style="color:#2563eb;text-decoration:underline;">${cleanUrl}</a>${trailing}`;
  });
}

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts &, <, >, ", and ' to their HTML entities.
 *
 * @private
 * @param {string} str - String to escape
 * @returns {string} HTML-safe string
 */
function sanitizeHtml_(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds HTML for attachment list and collects attachment blobs.
 *
 * Creates a styled attachment card showing all attachments for a message.
 * Also collects the attachment blobs into the allAttachments array for
 * inclusion in the final draft. De-duplicates attachments by name+size.
 *
 * @private
 * @param {GmailMessage} msg - The Gmail message to extract attachments from
 * @param {BlobSource[]} allAttachments - Array to collect attachment blobs (mutated)
 * @param {Object} seenAttachmentKeys - Object for de-duplication tracking (mutated)
 * @returns {string} HTML string for the attachment card, or empty string if no attachments
 */
function buildAttachmentsHtml_(msg, allAttachments, seenAttachmentKeys) {
  const attachments = msg.getAttachments({
    includeInlineImages: false,
    includeAttachments: true
  });
  if (!attachments || attachments.length === 0) return '';

  const items = [];
  for (const att of attachments) {
    // Simple de-duplication: same name + same size
    const key = `${att.getName()}|${att.getSize()}`;
    if (!seenAttachmentKeys[key]) {
      seenAttachmentKeys[key] = true;
      allAttachments.push(att); // Add blob to final draft
    }

    const sizeKb = Math.max(1, Math.round(att.getSize() / 1024));
    items.push(`
      <li style="margin:4px 0;line-height:1.4;">
        <span style="font-weight:500;">${sanitizeHtml_(att.getName())}</span>
        <span style="color:#6b7280;font-size:11px;"> (${sizeKb} KB)</span>
      </li>
    `);
  }

  return `
    <div style="
      margin-top:12px;
      padding:10px 12px;
      border-radius:8px;
      border:1px solid #dbeafe;
      background:#eff6ff;
    ">
      <div style="
        display:flex;
        align-items:center;
        margin-bottom:6px;
      ">
        <span style="
          font-size:12px;
          font-weight:700;
          color:#1e40af;
          margin-right:6px;
        ">[ATTACHMENTS]</span>
        <span style="
          font-size:11px;
          font-weight:500;
          color:#64748b;
        ">(${items.length} ${items.length === 1 ? 'file' : 'files'})</span>
      </div>
      <ul style="
        margin:0 0 0 20px;
        padding:0;
        font-size:13px;
        color:#111827;
        list-style:disc;
      ">${items.join('')}</ul>
    </div>
  `;
}

/**
 * Cleans and normalizes Unicode artifacts in email text.
 *
 * Handles encoding issues from Gmail's plain text conversion:
 * - Normalizes curly quotes to straight quotes
 * - Converts en/em dashes to hyphens
 * - Removes zero-width characters
 * - Removes problematic emoji that cause mojibake
 * - Preserves useful business symbols (bullets, arrows, checkmarks)
 *
 * @private
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text with normalized characters
 */
function cleanUnicodeArtifacts_(text) {
  if (!text) return '';

  // Step 1: try to normalize encoding via UTF-8 re-decode
  try {
    text = Utilities.newBlob(text).getDataAsString('UTF-8');
  } catch (e) {
    // If it fails, keep original
  }

  // Step 2: normalize punctuation we care about
  text = text
    // Curly single quotes -> '
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u2032/g, "'")
    .replace(/\u02BC/g, "'")
    // Curly double quotes -> "
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    // En/em dashes -> hyphen
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    // Non-breaking space -> regular space
    .replace(/\u00A0/g, ' ')
    // Replacement char -> remove
    .replace(/\uFFFD/g, '')
    // Zero-width characters (can cause rendering issues)
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Step 3: selective emoji/symbol removal
  // Preserve useful business symbols: bullets, arrows, checkmarks, stars
  const preserveSymbols = /[\u2022\u2023\u2043\u25E6\u2192\u2190\u2191\u2193\u2713\u2714\u2717\u2718\u2605\u2606]/;

  // Remove problematic emoji that cause mojibake
  text = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');

  // Remove most symbol ranges except those we want to preserve
  text = text.replace(/[\u2600-\u26FF]/g, (match) => {
    return preserveSymbols.test(match) ? match : '';
  });
  text = text.replace(/[\u2700-\u27BF]/g, (match) => {
    return preserveSymbols.test(match) ? match : '';
  });

  // Variation selector-16 (emoji modifiers)
  text = text.replace(/\uFE0F/g, '');

  return text;
}

/**
 * Cleans up plain text conversion artifacts from Gmail's getPlainBody().
 *
 * Gmail's plain text converter creates patterns like:
 * - "text <url>" from HTML links
 * - "phone <tel:phone>" from phone links
 * - HTML entities like &gt; and &lt;
 *
 * This function removes these duplicates and decodes entities.
 *
 * @private
 * @param {string} text - Text with potential conversion artifacts
 * @returns {string} Cleaned text
 */
function cleanPlainTextArtifacts_(text) {
  if (!text) return '';

  // Step 1: Decode common HTML entities that might remain
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Step 2: Clean up phone numbers with duplicate format
  // "573-442-1838 <5734421838>" -> "573-442-1838"
  text = text.replace(/(\d{3}[-.]?\d{3}[-.]?\d{4})\s*<(?:tel:)?(\d+)>/g, '$1');

  // Step 3: Clean up URLs with duplicate format
  // "example.com <https://example.com>" -> just the URL
  text = text.replace(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*<(https?:\/\/[^>]+)>/g, '$2');

  // Step 4: Clean up email addresses with duplicate format
  // "user@example.com <mailto:user@example.com>" -> "user@example.com"
  text = text.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*<mailto:\1>/g, '$1');

  // Step 5: Clean up bare angle bracket URLs
  // "<https://example.com>" -> "https://example.com"
  text = text.replace(/<(https?:\/\/[^>]+)>/g, '$1');

  // Step 6: Clean up any remaining malformed angle brackets
  text = text.replace(/\s*<[^>]*&[gl]t;[^>]*>/g, '');

  return text;
}

/**
 * Collapses soft line breaks while preserving intentional structure.
 *
 * Email clients often wrap lines at 72-80 characters, creating "soft" line
 * breaks that should be removed for better readability. However, we need
 * to preserve:
 * - List items (bullet points, numbered lists)
 * - Code blocks or preformatted text (indented content)
 * - Intentional short lines (like poetry or addresses)
 *
 * This function detects structured content and preserves it while collapsing
 * regular paragraph text.
 *
 * @private
 * @param {string} text - Text with potential soft line breaks
 * @returns {string} Text with soft breaks collapsed, structure preserved
 */
function collapseSoftLineBreaks_(text) {
  if (!text) return '';

  text = text.replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const paragraphs = [];
  let current = [];
  let inStructuredContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line marks paragraph break
    if (trimmed === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(inStructuredContent ? '\n' : ' '));
        current = [];
        inStructuredContent = false;
      }
      continue;
    }

    // Check if this looks like structured content
    const isListItem = REGEX_PATTERNS_.listMarker.test(trimmed);
    const isShortLine = trimmed.length < 40 && i > 0 && i < lines.length - 1;
    const hasSignificantIndent = line.length > 0 && line[0] === ' ' && line.indexOf(trimmed) > 2;

    // Start of structured content
    if ((isListItem || hasSignificantIndent) && !inStructuredContent) {
      // Flush current paragraph first
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
      inStructuredContent = true;
    }

    // If multiple consecutive short lines, might be intentional formatting
    if (isShortLine && current.length > 0) {
      const prevTrimmed = current[current.length - 1].trim();
      if (prevTrimmed.length < 40) {
        inStructuredContent = true;
      }
    }

    current.push(inStructuredContent ? line : trimmed);
  }

  // Flush remaining content
  if (current.length > 0) {
    paragraphs.push(current.join(inStructuredContent ? '\n' : ' '));
  }

  return paragraphs.join('\n\n');
}
