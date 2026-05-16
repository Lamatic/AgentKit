"use client";

import { useState } from "react";
import { generateQuery } from "@/actions/orchestrate";

interface QueryResult {
  sql: string | null;
  explanation: string;
  tables_used: string[];
  assumptions: string | null;
  confidence: "high" | "medium" | "low";
}

const SAMPLE_SCHEMA = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at DATE
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  status VARCHAR(20),
  order_date DATE
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2),
  category VARCHAR(50)
);`;

const SAMPLE_QUESTION =
  "Find the top 5 users who spent the most money on completed orders";

export default function Home() {
  const [schema, setSchema] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    const response = await generateQuery(schema, question);

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error || "Something went wrong.");
    }

    setLoading(false);
  };

  const loadSample = () => {
    setSchema(SAMPLE_SCHEMA);
    setQuestion(SAMPLE_QUESTION);
    setResult(null);
    setError("");
  };

  const confidenceColor = (level: string) => {
    if (level === "high") return "bg-green-100 text-green-800";
    if (level === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SQL Query Generator
          </h1>
          <p className="text-gray-600">
            Paste your database schema, ask a question in plain English, and get
            an optimized SQL query.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Database Schema
            </label>
            <button
              onClick={loadSample}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Load sample
            </button>
          </div>
          <textarea
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            placeholder="Paste your CREATE TABLE statements here..."
            className="w-full h-44 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <label className="block text-sm font-medium text-gray-700 mt-5 mb-2">
            Your Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "Find all users who placed more than 3 orders last month"'
            className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={handleSubmit}
            disabled={loading || !schema.trim() || !question.trim()}
            className="mt-4 w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generating..." : "Generate SQL"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            {/* Confidence Badge */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Result</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${confidenceColor(
                  result.confidence
                )}`}
              >
                {result.confidence} confidence
              </span>
            </div>

            {/* SQL */}
            {result.sql ? (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Generated SQL
                </label>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                    {result.sql}
                  </pre>
                  <button
                    onClick={() => {
                      if (result.sql) navigator.clipboard.writeText(result.sql);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  Could not generate a query for this input.
                </p>
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Explanation
              </label>
              <p className="text-gray-700 text-sm leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Tables Used */}
            {result.tables_used.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Tables Used
                </label>
                <div className="flex gap-2 flex-wrap">
                  {result.tables_used.map((table) => (
                    <span
                      key={table}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-mono rounded-full"
                    >
                      {table}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assumptions */}
            {result.assumptions && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Assumptions
                </label>
                <p className="text-gray-600 text-sm italic">
                  {result.assumptions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Powered by{" "}
          <a
            href="https://lamatic.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Lamatic.ai
          </a>
        </p>
      </div>
    </main>
  );
}
