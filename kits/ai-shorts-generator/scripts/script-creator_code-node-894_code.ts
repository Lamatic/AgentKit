// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
// 1. Pull in the complete array (texts and prompts) from the AI node
// 1. Extract the raw output from the AI node
const rawOutput = {{InstructorLLMNode_175.output}};

// 2. Safely parse if it's passed as a string, then grab the scenes array
const parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
const scenesList = Array.isArray(parsed) ? parsed : (parsed.scenes || []);

// 3. Map over the array
const finalPackage = scenesList.map(scene => ({
  scene_number: scene.scene_number,
  voiceover_text: scene.voiceover_text,
  image_prompt: scene.image_prompt
}));

// 4. Return the structured scenes
output = { scenes: finalPackage };