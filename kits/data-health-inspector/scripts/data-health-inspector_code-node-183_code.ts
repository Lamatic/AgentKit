const data = {{codeNode_951.output.raw_data}};
const cols = {{codeNode_951.output.columns}};


let types = {};
let consistency = {};

cols.forEach(c => {
  let numCount = 0, boolCount = 0, dateCount = 0, strCount = 0, total = 0;
  let wsIssues = 0;
  
  const isValidDate = (str) => {
    const s = str.trim();
    let y, m, d;
    let match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      y = Number(match[1]); m = Number(match[2]); d = Number(match[3]);
    } else if ((match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
      m = Number(match[1]); d = Number(match[2]); y = Number(match[3]);
    } else if ((match = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) {
      d = Number(match[1]); m = Number(match[2]); y = Number(match[3]);
    } else {
      return false;
    }
    const dateObj = new Date();
    dateObj.setHours(0, 0, 0, 0);
    dateObj.setFullYear(y, m - 1, d);
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
