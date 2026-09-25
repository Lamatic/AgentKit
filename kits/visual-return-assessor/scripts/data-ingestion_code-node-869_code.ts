// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.

const metaData = []
const vectorsArray = {{vectorizeNode_850.output}}?.vectors

const docName = {{triggerNode_1.output.documentName}}
const brand = {{triggerNode_1.output.brand}}
const category = {{triggerNode_1.output.category}}
const content = {{codeNode_281.output}} 
const currentVersion = Date.now();

if (!Array.isArray(vectorsArray) || vectorsArray.length === 0) {
  throw new Error("Policy vectorization returned no vectors.");
}

if (!Array.isArray(content) || content.length !== vectorsArray.length) {
  throw new Error("Policy chunks and vectors have different lengths.");
}

for (let i = 0; i < vectorsArray.length; i++){

  const pk = JSON.stringify([docName, brand, category, currentVersion, i]);

  metaData.push({ 
    "chunkId": pk,
    "documentName" : docName,
    "brand" : brand,
    "category" : category,
    "content" : content?.[i] || "",
    "version" : currentVersion
  })

}

  output = [currentVersion, metaData]
