// Code: Group Data
// Flow: 3b-finance-historical-stock-data

const stockData = {{apiNode_336.output}};

const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null; // handle invalid date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getWeekOfMonth = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return null;
  return Math.ceil(date.getDate() / 7);
};

function groupStockDataByMonthAndWeek(data) {
  if (!Array.isArray(data) || data.length === 0) return {};

  // Ensure all entries have valid dates
  const cleaned = data.filter((d) => d.date && !isNaN(new Date(d.date)));

  const sorted = [...cleaned].sort((a, b) => new Date(a.date) - new Date(b.date));

  const grouped = sorted.reduce((acc, entry) => {
    const monthKey = getMonthKey(entry.date);
    const week = getWeekOfMonth(entry.date);

    if (!monthKey || !week) return acc; // skip invalids

    const weekKey = `week${week}`;

    acc[monthKey] ??= {};
    acc[monthKey][weekKey] ??= [];
    acc[monthKey][weekKey].push(entry);

    return acc;
  }, {});

  const finalOutput = Object.entries(grouped).reduce((monthAcc, [month, weeks]) => {
    monthAcc[month] = Object.entries(weeks).reduce((weekAcc, [weekKey, entries]) => {
      const avg = (key) => {
        const validEntries = entries.filter((e) => typeof e[key] === "number");
        return validEntries.length
          ? validEntries.reduce((sum, e) => sum + e[key], 0) / validEntries.length
          : null;
      };

      weekAcc[weekKey] = {
        open: avg("open"),
        high: avg("high"),
        low: avg("low"),
        close: avg("close"),
        volume: avg("volume"),
        change: avg("change"),
        changePercent: avg("changePercent"),
        vwap: avg("vwap"),
        startDate: entries[0]?.date || null,
        endDate: entries[entries.length - 1]?.date || null,
      };

      return weekAcc;
    }, {});

    return monthAcc;
  }, {});

  return finalOutput;
}

output = groupStockDataByMonthAndWeek(stockData);
