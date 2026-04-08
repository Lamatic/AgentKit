function truncateContent(content) {
  if (content.length <= 100) {
    return content;
  }
  return content.substring(0, 100) + "...";
}

const searchResults = {{ searchNode_443.output.searchResults }};

const updatedResults = searchResults.map(doc => ({
  title: doc.title,       
  content: truncateContent(doc.content),
  source: doc.source,
  type: "Document"
}));

output = {"results": updatedResults};