// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
// 1. Get the original scenes (with voiceover text) from the first Code node
const originalScenes = {{codeNode_894.output.scenes}};
const imageResults = {{forLoopEndNode_779.output.loopOutput}};

const mergedScenes = originalScenes.map((scene, index) => {
  const rawResult = imageResults ? imageResults[index] : null;
  let finalImage = null;

  // Safely dig into the API response to find the actual image data
  if (rawResult) {
    const nodeKey = Object.keys(rawResult)[0]; // Automatically finds 'apiNode_224' or similar
    const nodeData = rawResult[nodeKey];

    // If the API was successful, format the Base64 text into a usable Image URL
    if (nodeData && nodeData.output && nodeData.output.success) {
       finalImage = "data:image/jpeg;base64," + nodeData.output.result.image;
    }
  }

  return {
    scene_number: scene.scene_number,
    voiceover_text: scene.voiceover_text,
    image_url: finalImage // Now outputs a clean URL or 'null' if it failed
  };
});

output = { scenes: mergedScenes };