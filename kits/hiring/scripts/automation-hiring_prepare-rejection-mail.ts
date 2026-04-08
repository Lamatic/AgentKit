// Code: Prepare Rejection Mail
// Flow: automation-hiring

const username = {{triggerNode_1.output.name}};
const strengths = {{InstructorLLMNode_145.output.strength}};
const weaknesses = {{InstructorLLMNode_145.output.weakness}};

const template = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Application Update – Lamatic.ai</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111827;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .header {
      background-color: black;
      padding: 20px 28px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header h2 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 28px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #111827;
    }
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #111827;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 18px;
    }
    a.button {
      display: inline-block;
      background-color: #ef4444;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 6px;
      margin: 8px 0 18px 0;
      font-size: 15px;
    }
    a.button:hover {
      background-color: #dc2626;
      color: #ffffff !important;
    }
    .feedback-section {
      background-color: #f9fafb;
      border-left: 4px solid #ef4444;
      padding: 20px;
      margin: 24px 0;
      border-radius: 6px;
    }
    .feedback-section h3 {
      margin-top: 0;
      color: #111827;
    }
    .feedback-section ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .feedback-section li {
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 8px;
    }
    .button {
      display: inline-block;
      background-color: #ef4444;
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 6px;
      margin: 8px 0 18px 0;
      font-size: 15px;
    }
    .button:hover {
      background-color: #dc2626;
    }
    a {
      color: #ef4444;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      background-color: #f9fafb;
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Lamatic.AI</h2>
    </div>

    <div class="content">
      <h1>Dear ` + username + `,</h1>

      <p>Thank you for taking the time to apply for a position at <strong>Lamatic.ai</strong> and for your interest in joining our team.</p>

      <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with the current requirements of this role.</p>

      <p>We want to provide you with constructive feedback from our review. We hope this insight helps you in your continued professional growth:</p>

      <div class="feedback-section">
        ` + strengths + `
        ` + weaknesses + `
      </div>

      <p>Your skills and experience are impressive, and we encourage you to keep an eye on our careers page for future opportunities that may be a better fit.</p>

      <a href="https://lamatic.ai/docs/career" class="button" target="_blank">View Future Openings</a>

      <p>We wish you the very best in your job search and future endeavors.</p>

      <p>Warm regards,<br><strong>Team Lamatic.ai</strong></p>
    </div>

    <div class="footer">
      © 2025 Lamatic.ai
    </div>
  </div>
</body>
</html>
`;

output = template;
