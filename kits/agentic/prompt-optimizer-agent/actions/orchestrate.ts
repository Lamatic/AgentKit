export async function optimizePrompt(prompt: string) {
  // TEMP fallback (no Lamatic call)
  return {
    success: true,
    result: "Optimized: " + prompt,
  };
}

// export async function optimizePrompt(prompt: string) {
//   try {
//     const res = await fetch(process.env.LAMATIC_API_URL!, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
//         "x-project-id": process.env.LAMATIC_PROJECT_ID!,
//       },
//       body: JSON.stringify({
//         query: `
//           mutation ExecuteFlow($workflowId: String!, $sampleInput: String!) {
//             executeWorkflow(
//               workflowId: $workflowId
//               sampleInput: $sampleInput
//             ) {
//               result
//               status
//             }
//           }
//         `,
//         variables: {
//           workflowId: "bb09a3ae-9cf4-4187-a223-dbc1d2666412", // 👈 from screenshot
//           sampleInput: prompt,
//         },
//       }),
//     });

//     const data = await res.json();
//     console.log("LAMATIC:", data);

//     return {
//       success: true,
//       result:
//         data?.data?.executeWorkflow?.result || "No result returned",
//     };
//   } catch (e) {
//     console.error(e);
//     return {
//       success: false,
//       result: "Error optimizing prompt",
//     };
//   }
// }