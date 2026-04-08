let vectors = {{vectorizeNode_814.output.vectors}};
  let metadataProps = [];
  let texts = {{chunkNode_860.output.chunks}};
  
  for (const idx in vectors) {
      let metadata = {}
      metadata["content"] = texts[idx].pageContent;
      metadata["file_name"] = {{triggerNode_1.output.filename}};
      metadataProps.push(metadata)
  }
output = {"metadata": metadataProps, "vectors": vectors};