## Title: feat(mockai): transform generic app into Mockai Interview prep platform

### 📖 Description
This PR significantly transforms the initial `agentic/mockai` app into **Mockai**, a powerful 3-step AI mock interview application tailored for an engaging user assessment journey. It introduces a modern, dynamic UI, reliable real-time microphone dictation, intelligent audio visualizations, and robust Vercel deployment configurations.

### 🧪 How to Test
1. Pull the branch and run `npm install`.
2. Ensure your `.env` contains the keys `AGENTIC_QUESTION_FLOW_ID`, `AGENTIC_FEEDBACK_FLOW_ID` mapping to your Lamatic workflows.
3. Start the server with `npm run dev` and navigate to `http://localhost:3200` (ensure you use `localhost` instead of a network IP, otherwise browsers block mic permissions).
4. Run through the interview, utilizing the real-time "Record Voice" functionality, and verify the feedback metrics at the end.
