// Code: Collate Results
// Flow: agentic-reasoning-data-source

const researchArray = {{forLoopEndNode_384.output.loopOutput}};

const research = researchArray.flatMap((searchEntry) => {
  const searchResults = searchEntry.searchNode_278.output.searchResults;
  return searchResults.map((result)=>{
    return result.content;
  })
});

const links = researchArray.flatMap((searchEntry) => {
  const searchResults = searchEntry.searchNode_278.output.searchResults;
  return searchResults.map((result)=>{
    return result.source;
  })
});

output = {
  research: research,
  links: links
};
