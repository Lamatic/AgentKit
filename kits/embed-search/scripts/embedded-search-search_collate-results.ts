// Code: Collate Results
// Flow: embedded-search-search

const pdfDBSearchResults = {{searchNode_842.output.searchResults}};
const websiteDBSearchResults = {{searchNode_145.output.searchResults}};

const pdfAverage = pdfDBSearchResults.length > 0 
  ? pdfDBSearchResults.reduce((sum, doc) => sum + (doc._additional.certainty || 0), 0) / pdfDBSearchResults.length 
  : 0;

const websiteAverage = websiteDBSearchResults.length > 0 
  ? websiteDBSearchResults.reduce((sum, doc) => sum + (doc._additional.certainty || 0), 0) / websiteDBSearchResults.length 
  : 0;

const searchResults = pdfAverage >= websiteAverage ? pdfDBSearchResults : websiteDBSearchResults;

const updatedResults = searchResults.map(doc => ({
  title: doc.title,       
  content: doc.content,
  type: doc.source
}));

output = {"results": updatedResults};
