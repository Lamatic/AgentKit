// Code: Data Quality Extract
// Flow: data-quality-agent

output = {
  content: "{{ triggerNode_1.output.file.content }}",
  name: "{{ triggerNode_1.output.file.name }}"
};
