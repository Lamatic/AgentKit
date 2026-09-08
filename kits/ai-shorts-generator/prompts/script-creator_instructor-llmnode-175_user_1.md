Write a 5-scene educational video script about:
{{triggerNode_1.output.sampleInput}}
Act as a professional technical educator and visual designer. Design the narration and visual for each scene together so they explain the same concept clearly and accurately.
For each of exactly 5 scenes, provide:
voiceover_text:
- Professional, technically accurate, concise explanation.
- Explain the concept clearly for someone learning it for the first time.
- Get directly to the important information.
- No cringe hooks, childish language, filler, repetition, motivational phrases, or unnecessary storytelling.
- Each scene should teach a distinct part of the topic and logically connect to the next scene.
- Target approximately 125–135 spoken words across all 5 scenes, suitable for roughly 60 seconds of narration. Do not claim an exact duration.
image_prompt:
- Create a literal, concrete educational visual that directly demonstrates the concept explained in that scene.
- Prefer simple, realistic educational visuals such as diagrams, flowcharts, coordinate systems, charts, physical objects, interfaces, or simple technical illustrations.
- The visual must directly teach the concept, not merely represent it.
- Do not use abstract metaphors, vague conceptual art, futuristic glowing graphics, decorative technology imagery, generic stock imagery, or empty environments.
- Keep the composition simple, focused, realistic, professional, bright, clean, and well lit.
- Avoid unnecessary people, objects, and visual clutter.
- Prefer visuals that can explain the concept without relying on text.
TEXT RULES FOR IMAGES:
- Never include production or meta text such as "Scene 1", "Scene 2", "Page 1", "Slide 1", "Shot 1", titles, subtitles, captions, watermarks, or production instructions.
- Instructional text is allowed only when it is genuinely necessary to explain the concept.
- Keep instructional text extremely short and simple.
- Do not request paragraphs, long sentences, long code blocks, or complex labels.
- Prefer diagrams, arrows, shapes, objects, and visual relationships over written text.
- Never add random, invented, misspelled, placeholder, or decorative text.
- Do not make the visual depend on large amounts of correctly rendered text.
CODE AND DIAGRAM RULES:
- If code is necessary, show only a very short snippet directly relevant to the concept.
- If exact code or text is not essential to the visual, do not ask the image model to render it.
- Keep diagrams simple and visually accurate.
- Clearly represent relationships, hierarchy, direction of flow, and data structures.
- Do not introduce technically incorrect, contradictory, or unrelated information.
- Image-generation models may render text and code incorrectly, so prioritize the visual explanation over exact text rendering.
SCENE DESIGN:
- Each scene must add new information.
- Do not repeat the same generic visual across scenes.
- Progress logically through the concept.
- The narration and image must describe the same subject, entities, relationships, and process.
- If the narration explains a process, show that process.
- If it explains architecture or data flow, show the actual components and connections.
- If it compares concepts, make the comparison visually clear.
- Avoid people unless they are genuinely useful for demonstrating the concept.
SAFETY:
- Generate only ordinary, family-friendly educational or professional visuals.
- Keep environments bright, clean, and well lit.
- Avoid violence, weapons, sexual content, graphic or disturbing imagery, dangerous activities, or other sensitive subjects.
- If a concept could be sensitive, represent it using a neutral diagram, object, interface, chart, or other non-sensitive educational visualization.
- Do not attempt to bypass image-generation safety systems.
OUTPUT:
- Produce exactly 5 scenes.
- Follow the provided JSON schema exactly.
- Return only the JSON object required by the schema.
- Do not return markdown, explanations, comments, or any content outside the JSON object.
