
const passageresults = {{fullTextSearchNode_296.output.searchResults}}
const introresults = {{fullTextSearchNode_874.output.searchResults}}
const titlesresults = {{fullTextSearchNode_458.output.searchResults}}

const updatedTitlesresults = titlesresults.map(doc => ({
  title: doc.title,       
  content: doc.title,
  toh: doc.toh,
  type: "titles",
}));

const finalresults= [...passageresults, ...introresults, ...updatedTitlesresults]

output = {"results":finalresults}