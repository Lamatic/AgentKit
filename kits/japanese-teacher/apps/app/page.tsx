// apps/app/page.tsx
"use client";

import { useState } from "react";
import { generateTextContext, generateQuestions } from "../actions/orchestrate";

// --- HELPER FUNCTION: Replaces Python's parse_and_highlight ---
// This processes the Japanese text, adds hover tooltips for vocab, 
// and formats the [furigana] into beautiful HTML ruby tags.
const formatJapaneseText = (text: string, dict: any[]) => {
  if (!text) return "";
  let html = text;
  const tokens: Record<string, string> = {};

  // 1. Process Vocabulary Tooltips
  if (dict && dict.length > 0) {
    // Sort dictionary by length descending to match longest words first
    const sortedDict = [...dict].sort((a, b) => (b["たんご／文法"]?.length || 0) - (a["たんご／文法"]?.length || 0));

    sortedDict.forEach((item, i) => {
      const word = item["たんご／文法"];
      const meaning = item["いみ"];
      const explanation = item["れいぶん・せつめい"];
      if (!word) return;

      // Extract stems for conjugated verbs
      let searchTerms = [word];
      if (word.includes("]")) {
        const baseIdx = word.lastIndexOf("]") + 1;
        for (let j = word.length - 1; j >= baseIdx; j--) {
          searchTerms.push(word.substring(0, j));
        }
      } else if (word.length > 2) {
        searchTerms.push(word.substring(0, word.length - 1));
      }

      // Find the first matching stem in the text
      for (const term of searchTerms) {
        // Escape special regex characters in the term
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Smart Regex: Match the term, AND safely absorb trailing [furigana] if it exists
        const regex = new RegExp(`(${escapedTerm}(?:\\[[^\\]<>]*\\])?)`);
        
        const match = html.match(regex);
        if (match) {
          const matchedString = match[0]; // Grabs the word + bracket (e.g., "温泉[おんせん]")
          const token = `[[TOKEN_${i}]]`;

          const tooltipHtml = `<span class="relative group text-blue-600 font-bold cursor-help border-b-2 border-blue-300 border-dotted inline-block">
            ${matchedString}
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl z-50 font-normal leading-relaxed text-left pointer-events-none">
              <strong class="text-blue-300">Meaning:</strong> ${meaning}<br/>
              <strong class="text-blue-300 mt-1 inline-block">Exp:</strong> ${explanation}
            </span>
          </span>`;

          tokens[token] = tooltipHtml;
          html = html.replace(matchedString, token);
          break;
        }
      }
    });

    // Put the HTML tokens back into the string
    for (const [token, tooltipHtml] of Object.entries(tokens)) {
      html = html.replace(token, tooltipHtml);
    }
  }

  // 2. Format Kanji[Furigana] into proper HTML <ruby> tags
  // CRITICAL FIX: The Regex now explicitly excludes < and > so it never destroys HTML tags!
  html = html.replace(/([\u4E00-\u9FAF々]+)\[([^\]<>]+)\]/g, "<ruby>$1<rt class='text-xs text-gray-500'>$2</rt></ruby>");

  return html;
};


export default function Home() {
  const [activeTab, setActiveTab] = useState<"lesson" | "quiz">("lesson");

  // --- LESSON STATE ---
  const [level, setLevel] = useState("N5");
  const [context, setContext] = useState("");
  const [wordsInput, setWordsInput] = useState("");
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  
  // Notice we now expect a structured object instead of a raw string
  const [activeLesson, setActiveLesson] = useState<{
    original: string;
    romanji: string;
    translation: string;
    dictionary: any[];
    context: string;
    level: string;
  } | null>(null);

  // --- QUIZ STATE ---
  const [quizSettings, setQuizSettings] = useState({
    grammar: 2,
    vocabulary: 2,
    context: 1,
    kanji: 1,
  });
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; max: number } | null>(null);

  // --- HANDLERS ---
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context) return alert("Please enter a topic/context!");

    setIsGeneratingLesson(true);
    const wordsList = wordsInput.split(",").map((w) => w.trim()).filter(Boolean);

    const res = await generateTextContext(level, context, wordsList);
    
    if (res.success && res.data) {
      try {
        // Parse the AI's JSON output
        let parsedData = res.data;
        if (typeof res.data === "string") {
          const cleanString = res.data.replace(/```json/g, "").replace(/```/g, "").trim();
          parsedData = JSON.parse(cleanString);
        }

        setActiveLesson({
          original: parsedData.original || "",
          romanji: parsedData.romanji || parsedData.romaji || "", // Catching potential spelling differences from AI
          translation: parsedData.translation || "",
          dictionary: parsedData.dictionary || [],
          context,
          level,
        });

        // Reset quiz if they generate a new lesson
        setQuizData(null); 
        setQuizResult(null);
      } catch (err) {
        alert("Failed to parse the lesson format from AI. Please try generating again.");
        console.error(err, res.data);
      }
    } else {
      alert("Error generating lesson: " + res.error);
    }
    setIsGeneratingLesson(false);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson) return alert("Please create a lesson first!");

    setIsGeneratingQuiz(true);
    const res = await generateQuestions(
      activeLesson.level,
      activeLesson.context,
      activeLesson.original,
      0, 
      quizSettings
    );

    if (res.success && res.data) {
      try {
        let parsedData = res.data;
        if (typeof res.data === "string") {
          const cleanString = res.data.replace(/```json/g, "").replace(/```/g, "").trim();
          parsedData = JSON.parse(cleanString);
        }
        setQuizData(parsedData);
        setUserAnswers({});
        setQuizResult(null);
      } catch (err) {
        alert("Failed to parse quiz format from AI.");
        console.error(err);
      }
    } else {
      alert("Error generating quiz: " + res.error);
    }
    setIsGeneratingQuiz(false);
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safely check for different possible list names from the AI
    const questionsList = quizData?.quiz || quizData?.Questions || quizData?.questions;
    
    if (!questionsList) return;

    let score = 0;
    let max = 0;

    questionsList.forEach((q: any) => {
      max += q.points || 1;
      const uAns = userAnswers[q.question_id] || "";
      if (uAns.startsWith(q.answer)) {
        score += q.points || 1;
      }
    });

    setQuizResult({ score, max });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <header className="bg-white shadow-sm pt-12 pb-6 px-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 mb-2">
          🇯🇵 Nihongo Flow
        </h1>
        <p className="text-gray-500">Contextual Japanese Learning with AI</p>
        
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setActiveTab("lesson")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === "lesson" ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            📖 Study Lesson
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === "quiz" ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            ✍️ Quiz
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-8 px-4">
        
        {/* ======================= */}
        {/*       LESSON TAB        */}
        {/* ======================= */}
        {activeTab === "lesson" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Lesson Setup</h2>
              <form onSubmit={handleCreateLesson} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">JLPT Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Context</label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., Buying a train ticket"
                    className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Words (Comma separated)</label>
                  <input
                    type="text"
                    value={wordsInput}
                    onChange={(e) => setWordsInput(e.target.value)}
                    placeholder="e.g., 食べる, 行く, 切符"
                    className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={isGeneratingLesson}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingLesson ? "⏳ Generating Lesson..." : "🚀 Create Lesson"}
                  </button>
                </div>
              </form>
            </div>

            {/* Active Lesson Display */}
            {activeLesson && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Your Lesson is Ready!</h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                    {activeLesson.level}
                  </span>
                </div>
                <p className="text-gray-500 mb-6 italic">Context: {activeLesson.context}</p>
                
                {/* 1. INTERACTIVE JAPANESE TEXT */}
                <div 
                  className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-3xl leading-loose tracking-wide md:text-left text-center shadow-inner font-medium"
                  dangerouslySetInnerHTML={{ 
                    __html: formatJapaneseText(activeLesson.original, activeLesson.dictionary) 
                  }} 
                />
                
                {/* 2. ROMANJI */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">🗣 Pronunciation (Romaji)</h3>
                  <p className="text-gray-800 text-lg">{activeLesson.romanji}</p>
                </div>

                {/* 3. TRANSLATION */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">🇬🇧 Translation</h3>
                  <p className="text-gray-800 text-lg">{activeLesson.translation}</p>
                </div>

                {/* 4. DICTIONARY TABLE */}
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">📘 Word Table</h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-100 uppercase tracking-wider text-gray-600">
                        <tr>
                          <th className="px-4 py-3 border-b">Word / Grammar</th>
                          <th className="px-4 py-3 border-b">Meaning</th>
                          <th className="px-4 py-3 border-b w-full">Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeLesson.dictionary.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-blue-600">
                              <span dangerouslySetInnerHTML={{ __html: item["たんご／文法"].replace(/([^\s\[\]]+)\[([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>") }} />
                            </td>
                            <td className="px-4 py-3 text-gray-800">{item["いみ"]}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-normal">{item["れいぶん・せつめい"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => {
                      setActiveTab("quiz");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md"
                  >
                    Take Quiz on this Lesson ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= */}
        {/*        QUIZ TAB         */}
        {/* ======================= */}
        {activeTab === "quiz" && (
          <div className="space-y-6">
            {/* Same Quiz Code from earlier goes here! */}
            {!activeLesson ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <p className="text-yellow-700 font-medium">⚠️ Please create a lesson first from the Study Lesson tab!</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-4">Quiz Settings</h2>
                  <form onSubmit={handleCreateQuiz}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {Object.keys(quizSettings).map((key) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                            {key}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={quizSettings[key as keyof typeof quizSettings]}
                            onChange={(e) => setQuizSettings({ ...quizSettings, [key]: parseInt(e.target.value) || 0 })}
                            className="w-full border-gray-300 rounded-lg p-2 border focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={isGeneratingQuiz}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isGeneratingQuiz ? "⏳ Preparing AI Quiz..." : "🎯 Prepare Quiz"}
                    </button>
                  </form>
                </div>

                {quizResult && (
                  <div className={`p-6 rounded-xl border ${quizResult.score === quizResult.max ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    <h2 className="text-2xl font-bold mb-2">
                      {quizResult.score === quizResult.max ? "🎉 Perfect!" : "📊 Quiz Complete"}
                    </h2>
                    <p className="text-lg">You scored <strong>{quizResult.score} / {quizResult.max}</strong>.</p>
                  </div>
                )}

                {/* Find the questions list safely */}
                {quizData && (quizData.quiz || quizData.Questions || quizData.questions) && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
                    <h2 className="text-xl font-bold mb-6">📝 Answer the Questions</h2>
                    <form onSubmit={handleQuizSubmit}>
                      
                      {/* Map through the questions */}
                      {(quizData.quiz || quizData.Questions || quizData.questions).map((q: any, idx: number) => {
                        const isSubmitted = quizResult !== null;
                        const userAnswer = userAnswers[q.question_id];
                        const isCorrect = userAnswer?.startsWith(q.answer);

                        return (
                          <div key={q.question_id} className="mb-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <p className="font-bold text-gray-800 mb-3">
                              {idx + 1}. {q.text} <span className="text-sm font-normal text-gray-500">(Points: {q.points})</span>
                            </p>
                            
                            <div className="space-y-2">
                              {q.options.map((opt: string, oIdx: number) => (
                                <label key={oIdx} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={q.question_id}
                                    value={opt}
                                    disabled={isSubmitted}
                                    checked={userAnswer === opt}
                                    onChange={() => setUserAnswers({ ...userAnswers, [q.question_id]: opt })}
                                    className="form-radio text-blue-600 h-5 w-5"
                                  />
                                  <span className="text-gray-700">{opt}</span>
                                </label>
                              ))}
                            </div>

                            {isSubmitted && (
                              <div className={`mt-4 p-3 rounded text-sm ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isCorrect ? (
                                  <>✅ Correct!</>
                                ) : (
                                  <>❌ Incorrect. The correct answer was: <strong>{q.answer}</strong></>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {!quizResult && (
                        <button
                          type="submit"
                          className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                        >
                          ✅ Finish Quiz and View Score
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}