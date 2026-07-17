const data = {{codeNode_951.output.raw_data}};
const cols = {{codeNode_951.output.columns}};


let types = {};
let consistency = {};

cols.forEach(c => {
  let numCount = 0, boolCount = 0, dateCount = 0, strCount = 0, total = 0;
  let wsIssues = 0;
  
  const isValidDate = (str) => {
    const s = str.trim();
    if (!/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})$/.test(s)) return false;
    const parts = s.split(/[-/]/).map(Number);
    let y, m, d;
    if (parts[0] > 1000) { y = parts[0]; m = parts[1]; d = parts[2]; }
    else if (parts[0] > 12) { d = parts[0]; m = parts[1]; y = parts[2]; }
    else { m = parts[0]; d = parts[1]; y = parts[2]; }
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d;
  };

  data.forEach(r => {
    let val = r[c];
    if (val !== null && val !== undefined && val.toString().trim() !== '') {
      total++;
      let s = val.toString();
      if (s !== s.trim()) wsIssues++;
      
      if (!isNaN(Number(s))) numCount++;
      else if (s.toLowerCase() === 'true' || s.toLowerCase() === 'false') boolCount++;
      else if (isValidDate(s)) dateCount++;
      else strCount++;
    }
  });
  
  let type = "STRING";
  if (total > 0) {
    if (numCount >= total * 0.8) type = "NUMBER";
    else if (boolCount >= total * 0.8) type = "BOOLEAN";
    else if (dateCount >= total * 0.8) type = "DATE";
  }
  
  types[c] = { type, mixed: (strCount > 0 && type !== "STRING") };
  if (wsIssues > 0) consistency[c] = { issue: "WHITESPACE_INCONSISTENCY", count: wsIssues };
});

output = { column_types: types, consistency_issues: consistency };
