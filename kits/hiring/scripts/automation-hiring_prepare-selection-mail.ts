// Code: Prepare Selection Mail
// Flow: automation-hiring

const username = {{triggerNode_1.output.name}};

const template = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Congratulations – Round 1 Cleared | Lamatic.ai</title>
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
    .header img {
      height: 28px;
      display: block;
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
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 18px;
    }
    .button {
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
    .button:hover {
      background-color: #dc2626;
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
    <!-- Header -->
    <div class="header">
      <h2>Lamatic.AI</h2>
    </div>

    <!-- Body -->
    <div class="content">
      <h1>Congratulations, ${username}! 🎉</h1>

      <p>We're excited to inform you that you've successfully cleared <strong>Round 1</strong> of our interview process at <strong>Lamatic.ai</strong>!</p>

      <p>Your profile and skills have impressed our team, and we'd love to move forward with <strong>Round 2</strong> – a 30-minute conversation to dive deeper into your experience and discuss how you can contribute to our mission.</p>

      <p>Please use the link below to schedule a convenient time for our call:</p>

      <a href="https://calendly.com/dhruvp-lamatic/30min" class="button" target="_blank">Schedule Your Round 2 Call</a>

      <p>We're looking forward to speaking with you soon and learning more about your journey!</p>

      <p>Warm regards,<br><strong>Team Lamatic.ai</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © 2025 Lamatic.ai
    </div>
  </div>
</body>
</html>
`;

output = template;
