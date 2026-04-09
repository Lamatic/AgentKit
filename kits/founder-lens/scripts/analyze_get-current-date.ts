let now = new Date();
let year = now.getFullYear();
let month = now.toLocaleString('en-US', { month: 'long' });
return {
  year: String(year),
  prevYear: String(year - 1),
  dateString: month + ' ' + String(year)
};