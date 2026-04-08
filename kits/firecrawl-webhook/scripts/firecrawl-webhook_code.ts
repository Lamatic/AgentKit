let vectorData = "title: " + {{ triggerNode_1.output.data }}[0].metadata.title + " \n description: " + {{ triggerNode_1.output.data }}[0].metadata.description + " \n url: " + {{ triggerNode_1.output.data }}[0].metadata.url + " \n sourceURL: " + {{ triggerNode_1.output.data }}[0].metadata.sourceURL + " \n markdown: " + {{ triggerNode_1.output.data }}[0].markdown

let MetaData = {
  rawHtml: {{ triggerNode_1.output.data }}[0].rawHtml,  
  markdown: {{ triggerNode_1.output.data }}[0].markdown,
  title: {{ triggerNode_1.output.data }} [0].metadata.title,
  description: {{ triggerNode_1.output.data }} [0].metadata.description,
  url: {{ triggerNode_1.output.data }}[0].metadata.url,
  sourceURL:{{ triggerNode_1.output.data }} [0].metadata.sourceURL,
}

output = {"vectorData":[vectorData],"MetaData":[MetaData]};