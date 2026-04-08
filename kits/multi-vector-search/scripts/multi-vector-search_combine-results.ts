
const passageresults = {{searchNode_147.output.searchResults}}
const introresults = {{searchNode_549.output.searchResults}}
const titlesresults = {{searchNode_795.output.searchResults}}

const updatedTitlesresults = titlesresults.map(doc => ({
  title: doc.title,       
  content: doc.title,
  toh: doc.toh,
  type: "titles",
}));

const finalresults= [...passageresults, ...introresults, ...updatedTitlesresults]

output = {"results":finalresults}