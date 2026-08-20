function validateSQL(sql) {
  if (!sql) return { valid: false, reason: 'No query generated' };
  const upper = sql.toUpperCase().trim();
  if (!upper.startsWith('SELECT')) return { valid: false, reason: 'Only SELECT allowed' };
  const blocked = ['DROP','DELETE','UPDATE','INSERT','ALTER','TRUNCATE','GRANT',';--'];
  if (blocked.some(k => upper.includes(k))) return { valid: false, reason: 'Blocked keyword detected' };
  if (!upper.includes('LIMIT')) sql += ' LIMIT 500';
  return { valid: true, sql };
}
return validateSQL({{InstructorLLMNode_573.output.sql}})