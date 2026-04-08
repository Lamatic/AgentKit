// Code: One Year Ago Date
// Flow: 3b-finance-historical-stock-data

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const year = oneYearAgo.getFullYear();
const month = (oneYearAgo.getMonth() + 1).toString().padStart(2, '0');
const day = (oneYearAgo.getDate()-1).toString().padStart(2, '0');

output = `${day}-${month}-${year}`;
