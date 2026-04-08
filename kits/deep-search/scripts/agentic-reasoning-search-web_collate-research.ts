// Code: Collate Research
// Flow: agentic-reasoning-search-web

const researchArray = {{forLoopEndNode_366.output.loopOutput}};

const research = researchArray.flatMap((searchEntry) => {
  return searchEntry.webSearchNode_441.output.output.organic;
});

const links = research.map((item) => item.link);

output = {
  research: research,
  links: links
};
