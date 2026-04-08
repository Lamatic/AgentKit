// Creating vectorData
let vectorData = "title: " + {{triggerNode_1.output.title}} + " \n toh: " + {{triggerNode_1.output.toh}} + " \n content: " + {{triggerNode_1.output.passage_content}}  + " \n type: " + {{triggerNode_1.output.passage_type}}

// for Multiple Toh id use one eg. toh312,toh628,toh1093 => toh312

let firstId = {{triggerNode_1.output.toh}}.split(',')[0];

let content = {{triggerNode_1.output.passage_content}}
if({{triggerNode_1.output.restriction}}){
  content = "⚠ Restricted - \n\n " + {{triggerNode_1.output.passage_content}}
}

// Creating MetaData

let MetaData = {
  title: {{triggerNode_1.output.title}},       
  content: content,
  toh: firstId, 
  workxmlID: {{triggerNode_1.output.work_xmlid}},
  passagexmlID: {{triggerNode_1.output.passage_xmlid}}, // Use as primary ?
  date: {{triggerNode_1.output.publication_date}}, // Not Present
  label: {{triggerNode_1.output.passage_label}},
  type: {{triggerNode_1.output.passage_type}},
  sort: {{triggerNode_1.output.sort}},
  restriction: {{triggerNode_1.output.restriction}},
  parent: {{triggerNode_1.output.passage_parent}}
}
output = {"vectorData":[vectorData],"MetaData":[MetaData]};