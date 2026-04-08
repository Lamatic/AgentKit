let docs = {{scraperNode_823.output.markdown}};

// Convert to array if it isn't one already
let docsArray = Array.isArray(docs) ? docs : [docs];

// Map safely, providing a fallback for pageContent if the doc is just a string
return docsArray.map((doc) => (typeof doc === 'object' ? doc.pageContent : doc));