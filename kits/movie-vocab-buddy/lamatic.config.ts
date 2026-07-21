export default {
  name: "Movie Vocab Buddy",
  description: "Learn English vocabulary and phrases straight from the movies and shows you watch — extracted, explained, and reinforced with spaced-repetition quizzes.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Nanditha S", email: "nandithasalim@gmail.com" },
  tags: ["language-learning", "education", "rag", "vocabulary", "spaced-repetition"],
  steps: [
    { id: "extract-vocabulary", type: "mandatory" as const, envKey: "EXTRACT_VOCAB_FLOW_ID" },
    { id: "post-movie-quiz", type: "mandatory" as const, envKey: "POST_MOVIE_QUIZ_FLOW_ID" },
  
    { id: "weekly-quiz", type: "mandatory" as const }
  ],
  links: {
    demo: "",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/movie-vocab-buddy",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/movie-vocab-buddy/apps",
    docs: ""
  }
};