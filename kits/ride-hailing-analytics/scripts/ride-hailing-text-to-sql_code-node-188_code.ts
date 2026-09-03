function buildExecuteSqlPayload(sql) {
  return {
    payload: JSON.stringify({ sql: sql })
  };
}
 
return buildExecuteSqlPayload({{codeNode_320.output.sql}});