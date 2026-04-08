Your task is to evaluate the candidate by synthesizing a comprehensive profile based on all provided information, adhering strictly to the data given. You will be given the candidate information from their resume.

---

### 🧠 **Crucial Rules for Evaluation**

**Synthesize All Information:**  
Create a complete picture of the candidate by cross-referencing details from all provided info in the resume. Ensure the analysis is cohesive and draws logical connections between all provided data.

**No Hallucination:**  
Base your evaluation solely on the explicitly provided information. Do **not** assume, infer, or invent any details that are not present in the candidate’s profile.

---

### 🧾 Output Format Rules

You must output the result strictly following the schema below.

Each field must exactly match its required format and type.

---

#### 🎯 Output Schema

```json
{
  "score": "number — Final Weighted Overall Score (1–10, rounded to two decimal places)",
  "strength": "string — HTML-formatted list of 2–4 bullet points highlighting candidate's key strengths",
  "weakness": "string — HTML-formatted list of 2–4 bullet points highlighting candidate's key weaknesses",
  "recommendation": "string — either 'Selected' or 'Rejected'"
}

```

---

### 🧩 Output Details

**1\. score**

* Calculate the **Final Weighted Overall Score** as the arithmetic mean of the five criteria scores.
* Round the final score to **two decimal places** (e.g., `7.98`).

**2\. strength**

* Return a **string** containing HTML list tags (`<ul><li>...</li></ul>`).
* Include **2–4 concise bullet points** summarizing the candidate’s **key strengths**.
* The entire list should be wrapped in `<ul>...</ul>` and returned as a **single string**.

**3\. weakness**

* Return a **string** containing HTML list tags (`<ul><li>...</li></ul>`).
* Include **2–4 concise bullet points** summarizing the candidate’s **key weaknesses**.
* The entire list should be wrapped in `<ul>...</ul>` and returned as a **single string**.

**4\. recommendation**

* Based on the evaluation and score, output either `"Selected"` or `"Rejected"`.
* This must be a plain string — **no extra text or formatting**.

---

### 🧱 Example Output

```json
{
  "score": 7.85,
  "strength": "<ul><li>Extensive senior-level marketing experience in tech and startups.</li><li>Strong foundational skills in B2B and Product Marketing.</li><li>Combined educational background in Computer Science and MBA adds versatility.</li></ul>",
  "weakness": "<ul><li>No demonstrated experience in the AI/ML industry.</li><li>Lack of quantifiable achievements to assess past performance.</li></ul>",
  "recommendation": "Selected"
}

```

---

### 📄 1\. Context

**Job Description:** {{triggerNode_1.output.job_description}}

---

### 🧮 2\. Evaluation Criteria

Provide internal reasoning to determine the **Final Weighted Overall Score** by evaluating these dimensions (you don’t need to output individual scores, just the final average):

1. **Projects/Portfolio/Resume:**  
Evaluate the quality, relevance, and completeness of the candidate’s portfolio, resume, and any project-related information for the applied role.
2. **Experience:**  
Assess the candidate’s professional experience, focusing on its relevance and duration relative to the job description.
3. **Achievements:**  
Analyze the specificity, impact, and relevance of the candidate’s listed achievements.
4. **Skill Match:**  
Determine how well the candidate’s skills align with the requirements of the applied role.
5. **Overall Fit:**  
Judge the candidate’s overall suitability and readiness for the role based on the above factors.