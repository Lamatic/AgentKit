let config;
let LAMATIC_API_KEY;
let LAMATIC_URL;
let PROJECT_ID;
let WORKFLOW_ID;

let currentText = '';
let lastResult = '';

// Load config first, then initialize
fetch(chrome.runtime.getURL("lamatic-config.json"))
  .then(res => res.json())
  .then(data => {
    config = data;
    LAMATIC_API_KEY = config.api.key;
    LAMATIC_URL = config.api.endpoint;
    PROJECT_ID = config.api.projectId;
    WORKFLOW_ID = config.flows.grammar_check.workflowId;
    
    // Initialize the side panel after config is loaded
    initializeSidePanel();
  })
  .catch(error => {
    console.error('Failed to load config:', error);
    showError('Failed to load configuration. Please reload the extension.');
});

function initializeSidePanel() {
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TEXT_SELECTED') {
      displayText(message.text);
    }
  });

  // Request any stored selection when sidepanel opens
  chrome.runtime.sendMessage({ type: 'GET_SELECTION' }, (response) => {
    if (response && response.text) {
      displayText(response.text);
    }
  });

  // Send button click handler
  document.getElementById('sendBtn').addEventListener('click', async () => {
    const text = document.getElementById('selectedText').value.trim();
    
    if (!text) {
      showError('Please select or type some text first!');
      return;
    }
    
    await sendToLamatic(text);
  });

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', () => {
    if (lastResult) {
      navigator.clipboard.writeText(lastResult).then(() => {
        showNotification('✓ Copied to clipboard!');
      });
    }
  });

  // Allow manual text input to enable send button
  document.getElementById('selectedText').addEventListener('input', (e) => {
    const hasText = e.target.value.trim().length > 0;
    document.getElementById('sendBtn').disabled = !hasText;
  });

  // Initial state
  document.getElementById('sendBtn').disabled = true;
}

function displayText(text) {
  if (!text || text.trim() === '') return;
  
  currentText = text;
  const textarea = document.getElementById('selectedText');
  textarea.value = text;
  
  // Add highlight animation
  textarea.classList.add('text-updated');
  setTimeout(() => textarea.classList.remove('text-updated'), 600);
  
  // Enable send button
  document.getElementById('sendBtn').disabled = false;
  
  // Hide previous results
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('errorSection').style.display = 'none';
}

async function sendToLamatic(text) {
  const sendBtn = document.getElementById('sendBtn');
  const btnText = sendBtn.querySelector('.btn-text');
  const loader = sendBtn.querySelector('.loader');
  
  // Show loading state
  sendBtn.disabled = true;
  btnText.textContent = 'Checking...';
  loader.style.display = 'block';
  
  // Hide previous results
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('errorSection').style.display = 'none';
  
  const query = `
    query ExecuteWorkflow(
      $workflowId: String!
      $text: String        
    ) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          text: $text
        }
      ) {
        status
        result
      }
    }
  `;
  
  const variables = {
    workflowId: WORKFLOW_ID,
    text: text
  };
  
  try {
    const response = await fetch(LAMATIC_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LAMATIC_API_KEY}`,
        'Content-Type': 'application/json',
        'x-project-id': PROJECT_ID
      },
      body: JSON.stringify({ query, variables })
    });
    
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message || 'API Error');
    }
    
    if (data.data && data.data.executeWorkflow) {
      const { status, result } = data.data.executeWorkflow;
      
      if (status === 'success' || status === 'completed') {
        showResult(result);
      } else {
        showError(`Workflow status: ${status}`);
      }
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message || 'Failed to check grammar. Please try again.');
  } finally {
    // Reset button state
    sendBtn.disabled = false;
    btnText.textContent = 'Check Grammar';
    loader.style.display = 'none';
  }
}

function showResult(result) {
  const resultSection = document.getElementById('resultSection');
  const resultText = document.getElementById('resultText');
  const correctionsContainer = document.getElementById('correctionsContainer');
  const correctionsList = document.getElementById('correctionsList');

  if (!correctionsContainer || !correctionsList) {
    console.error('Missing corrections container in HTML.');
    return;
  }

  // Reset
  correctionsContainer.innerHTML = '';

  let correctedText = '';
  let corrections = [];

  try {
    if (typeof result === 'string') {
      result = JSON.parse(result);
    }

    correctedText =
      result.corrected_text ||
      result.output ||
      result.text ||
      result.result ||
      JSON.stringify(result, null, 2);

    if (result.corrections && Array.isArray(result.corrections)) {
      corrections = result.corrections;
    }
  } catch (error) {
    console.warn('Result is not valid JSON, using raw string.');
    correctedText = String(result);
  }

  // Default message
  if (!correctedText || correctedText.trim() === '') {
    correctedText = '✅ No corrections needed! Your text looks good.';
  }

  lastResult = correctedText;
  resultText.textContent = correctedText;

  // Render corrections neatly
  if (corrections.length > 0) {
    corrections.forEach((c, i) => {
      const div = document.createElement('div');
      div.className = 'correction-item';
      div.innerHTML = `
        <strong>Issue ${i + 1}:</strong> ${c.error_type || 'General'}<br>
        <strong>Original:</strong> "${c.original_text || '-'}"<br>
        <strong>Suggestion:</strong> "${c.suggested_text || '-'}"
        ${c.confidence ? `<div class="correction-meta">Confidence: ${(c.confidence * 100).toFixed(0)}%</div>` : ''}
      `;
      correctionsContainer.appendChild(div);
    });

    correctionsList.style.display = 'block';
  } else {
    correctionsList.style.display = 'none';
  }

  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(message) {
  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');
  
  errorText.textContent = message;
  errorSection.style.display = 'block';
  
  // Scroll to error
  errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}