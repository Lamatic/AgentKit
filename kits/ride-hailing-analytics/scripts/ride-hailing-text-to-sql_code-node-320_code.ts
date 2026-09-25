function validateSQL(sql) {
  if (!sql) return { valid: false, reason: 'No query generated', sql: '' };
  let cleaned = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const upper = cleaned.toUpperCase().trim();
  if (!upper.startsWith('SELECT')) {
    return { valid: false, reason: 'Only SELECT allowed', sql: '' };
  }
  if (/\bSELECT\b[\s\S]*?\bINTO\b/.test(upper)) {
    return { valid: false, reason: 'SELECT INTO is not allowed', sql: '' };
  }
  const trimmedUpper = upper.replace(/\s+$/, '');
  const semicolonIndex = trimmedUpper.indexOf(';');
  if (semicolonIndex !== -1 && semicolonIndex !== trimmedUpper.length - 1) {
    return { valid: false, reason: 'Multiple statements are not allowed', sql: '' };
  }
  const blocked = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'CREATE', 'REPLACE', 'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'ATTACH', 'DETACH', 'VACUUM', 'COPY', 'DO'];
  const hasBlockedKeyword = blocked.some(k => new RegExp('\\b' + k + '\\b').test(upper));
  if (hasBlockedKeyword) {
    return { valid: false, reason: 'Blocked keyword detected', sql: '' };
  }
  let finalSql = cleaned.trim().replace(/;\s*$/, '');
  const limitMatch = finalSql.match(/\bLIMIT\s+(\d+)\b/i);
  if (!limitMatch) {
    finalSql += ' LIMIT 500';
  } else {
    const currentLimit = parseInt(limitMatch[1], 10);
    if (currentLimit > 500) {
      finalSql = finalSql.replace(/\bLIMIT\s+\d+\b/i, 'LIMIT 500');
    }
  }
  return { valid: true, sql: finalSql, reason: '' };
}
return validateSQL({{InstructorLLMNode_573.output.sql}})