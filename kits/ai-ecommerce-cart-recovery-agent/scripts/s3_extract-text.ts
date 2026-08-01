const files = {{ extractFromFileNode_944.output.files }};

if (
  Array.isArray(files) &&
  files.length > 0 &&
  Array.isArray(files[0]?.data) &&
  files[0].data.length > 0
) {
  output = files[0].data[0];
} else {
  output = "";
}