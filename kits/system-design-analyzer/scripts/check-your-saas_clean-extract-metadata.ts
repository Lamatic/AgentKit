const input = {{triggerNode_1.output.system_design}} || "";
const trimmed = input.trim();
const lines = trimmed.split('\n');
const hasNumbers = /(\d+[KMG]?\s*(QPS|users|req|ms|sec|GB|TB|ops))/.test(trimmed);
const hasGeo = /(multi-region|cross-region|distributed|global|failover|datacenter)/.test(trimmed.toLowerCase());
const hasRealtime = /(real-time|realtime|live|WebSocket|streaming|subscription|cursor|presence)/.test(trimmed.toLowerCase());
const hasFinance = /(payment|transaction|settlement|balance|financial|money)/.test(trimmed.toLowerCase());

output = {
  design: trimmed.slice(0, 4000),
  word_count: trimmed.split(/\s+/).length,
  has_scale_numbers: hasNumbers,
  mentions_geo: hasGeo,
  mentions_realtime: hasRealtime,
  mentions_financial: hasFinance,
  line_count: lines.length
};
