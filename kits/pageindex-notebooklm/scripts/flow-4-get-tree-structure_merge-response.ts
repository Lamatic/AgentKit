const action = {{triggerNode_1.output.action}};

if (action === "get_tree") {
  const getResult = {{postgresNode_206.output.queryResult}};
  const doc = getResult && getResult[0];

  if (!doc) {
    output = {
      success: false,
      action: "get_tree",
      message: "Document not found",
      doc_id: {{triggerNode_1.output.doc_id}},
      tree: null,
      file_name: null,
      tree_node_count: null,
      created_at: null
    };
  } else {
    output = {
      success: true,
      action: "get_tree",
      message: "Document fetched successfully",
      doc_id: {{triggerNode_1.output.doc_id}},
      tree: JSON.stringify(doc.tree),
      file_name: doc.file_name,
      tree_node_count: doc.tree_node_count,
      created_at: doc.created_at
    };
  }

} else {
  const deleteResult = {{postgresNode_113.output.queryResult}};

  if (!deleteResult || deleteResult.length === 0) {
    output = {
      success: false,
      action: "delete",
      message: "Document not found or already deleted",
      doc_id: {{triggerNode_1.output.doc_id}},
      tree: null,
      file_name: null,
      tree_node_count: null,
      created_at: null
    };
  } else {
    output = {
      success: true,
      action: "delete",
      message: "Document deleted successfully",
      doc_id: deleteResult[0].doc_id,
      tree: null,
      file_name: deleteResult[0].file_name,
      tree_node_count: null,
      created_at: null
    };
  }
}