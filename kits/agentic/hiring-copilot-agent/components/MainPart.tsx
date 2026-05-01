"use client";

import Image from "next/image";
import toast from "./Toast";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import * as motion from "motion/react-client";
import { jost, poppins } from "@/app/fonts";
import { AnimatePresence } from "motion/react";

const MainPart = () => {
  const [jobDesc, setJodDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [chatBegan, setChatBegan] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [messages, setMessages] = useState<
    { type: "user" | "ai"; content: any }[]
  >([]);

  const handleAddClick = () => {
    document.getElementById("fileInput")?.click();
  };

  const handleSubmit = async () => {
    if (evaluating) return;

    if (files.length === 0 || !jobDesc || jobDesc.length < 12) {
      if (files.length === 0) {
        toast({ title: "Ensure at least 1 Resume File" });
      } else {
        toast({ title: "JD must be greater than 12 chars." });
      }
      return;
    }

    setChatBegan(true);
    setEvaluating(true);

    try {
      setMessages((prev) => [...prev, { type: "user", content: jobDesc }]);

      const processFile = async (file: File) => {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const parsedRes = await fetch("/api/parse-resume", {
            method: "POST",
            body: formData,
          });

          if (!parsedRes.ok) {
            return null;
          }
          const parsedData = await parsedRes.json();
          // console.log("PARSED DATA:", parsedData);
          let parsed;

          try {
            let raw = parsedData.parsed;
            raw = raw
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            parsed = JSON.parse(raw);
            // console.log("PARSED JSON:", parsed);
          } catch {
            // console.error("Parsing JSON failed", parsedData);
            return null;
          }
          const evalRes = await fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_description: jobDesc,
              name: parsed.name || "",
              skills: parsed.skills || [],
              experience_years: parsed.experience_years || 0,
              projects: (parsed.projects || [])
                .map((p: any) => {
                  const name =
                    typeof p?.name === "string" ? p.name.trim() : "";
                  const skills = Array.isArray(p?.skills_gained)
                    ? p.skills_gained.filter(Boolean)
                    : [];
                  return [name, skills.join(", ")].filter(Boolean).join(": ");
                })
                .filter(Boolean),
              education: parsed.education || "",
              certificates: parsed.certificates || [],
            }),
          });

          if (!evalRes.ok) {
            return null;
          }

          const evalData = await evalRes.json();
          // console.log("EVAL RESPONSE:", evalData);
          return evalData?.data || null;
        } catch (err) {
          // console.error("Error processing file:", err);
          return null;
        }
      };

      const results: any[] = [];
      const batchSize = 5;

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map((file) => processFile(file)),
        );

        results.push(
          ...batchResults
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r: any) => r.value),
        );
      }

      const sortedResults = results
        .filter((r) => r?.evaluation?.final_score != null)
        .sort(
          (a: any, b: any) =>
            b.evaluation.final_score - a.evaluation.final_score,
        );

      setMessages((prev) => [...prev, { type: "ai", content: sortedResults }]);
      setFiles([]);
      setJodDesc("");
    } catch (err) {
      // console.error("Batch processing error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-5 mt-1 py-25 h-full w-full max-w-[1000px]">
      <input
        id="fileInput"
        type="file"
        multiple
        accept="application/pdf"
        className="hidden absolute"
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          setFiles((prev) => [...prev, ...selectedFiles]);
          e.currentTarget.value = "";
        }}
      />

      <AnimatePresence mode="wait">
        {!chatBegan ? (
          <motion.div
            className="flex flex-col justify-evenly items-center gap-12 w-full"
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={
                "flex flex-col items-center text-2xl md:text-4xl lg:text-6xl gap-2 font-semibold " +
                jost.className
              }
            >
              <div>Shortlist Candidates</div>
              <div className="text-[#D0FF00]">Smarter, Faster, Quicker!</div>
            </div>

            <motion.div
              className="relative w-full"
              layoutId="textarea"
              transition={{ duration: 1 }}
            >
              <Textarea
                value={jobDesc}
                className={
                  "scrollbar-custom w-full h-[150px] border-[#D0FF00] rounded-4xl focus:shadow-[0_0_3px_0px_#D0FF00] focus:ring-0 focus-visible:ring-0 outline-none focus-visible:border-[#D0FF00] p-5 " +
                  poppins.className
                }
                placeholder="Paste JD and upload resumes"
                onChange={(e) => setJodDesc(e.target.value)}
              />

              <div className="flex justify-between items-center px-5 relative bottom-14">
                <div
                  onClick={handleAddClick}
                  className="flex items-center gap-3 bg-gray-800 p-2 px-3 rounded-full cursor-pointer"
                >
                  <Image src={"/add.svg"} alt="" width={20} height={20} />
                  <div className="text-sm">{files.length} uploaded</div>
                </div>

                <div
                  onClick={handleSubmit}
                  className="rounded-full p-3 bg-[#D0FF00] cursor-pointer"
                >
                  <Image src={"/up-arrow.svg"} width={18} height={18} alt="" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div className="flex-1 w-full flex flex-col justify-between items-center">
            <div className="flex flex-col gap-6 overflow-y-auto pb-32 w-full">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  {msg.type === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-[#D0FF00] text-black p-4 rounded-2xl max-w-[70%] text-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="text-gray-400 text-sm">
                        Ranked Candidates
                      </div>

                      {msg.content.map((c: any, i: number) => {
                        const medal =
                          i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : "🎯";

                        return (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-gray-800 bg-[#111]"
                          >
                            <div className="flex justify-between">
                              <div>
                                <div className="font-semibold text-lg">
                                  {medal} {c?.candidate?.name ?? "Unknown"}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {c?.evaluation?.verdict}
                                </div>
                              </div>

                              <div className="text-xl font-bold text-[#D0FF00]">
                                {c?.evaluation?.final_score ?? 0}%
                              </div>
                            </div>

                            <div className="text-sm mt-3 text-gray-400">
                              {c.reasoning?.reasoning}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {evaluating && (
                <div className="text-gray-400 text-sm">Evaluating...</div>
              )}
            </div>

            <motion.div
              className="fixed bottom-0 w-[90%] md:w-[75%] lg:w-[60%]"
              layoutId="textarea"
              transition={{ duration: 1 }}
            >
              <Textarea
                value={jobDesc}
                className={
                  "scrollbar-custom w-full h-[90px] border-[#D0FF00] rounded-xl md:rounded-4xl focus:shadow-[0_0_3px_0px_#D0FF00] focus:ring-0 focus-visible:ring-0 outline-none focus-visible:border-[#D0FF00] p-5 bg-gray-600 " +
                  poppins.className
                }
                placeholder="Paste new JD and upload resumes..."
                onChange={(e) => setJodDesc(e.target.value)}
              />

              <div className="flex justify-between items-center px-5 relative bottom-11">
                <div
                  onClick={handleAddClick}
                  className="flex items-center gap-3 bg-gray-800 p-1 px-2 rounded-full cursor-pointer"
                >
                  <Image src={"/add.svg"} alt="" width={20} height={20} />
                  <div className="text-[10px]">{files.length} uploaded</div>
                </div>

                <div
                  onClick={handleSubmit}
                  className="rounded-full p-3 bg-[#D0FF00] cursor-pointer"
                >
                  <Image src={"/up-arrow.svg"} width={12} height={12} alt="" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainPart;
