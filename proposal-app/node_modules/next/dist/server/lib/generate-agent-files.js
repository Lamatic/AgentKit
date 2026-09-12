/**
 * Auto-generate AGENTS.md / CLAUDE.md with the managed Next.js agent-rules
 * block when `next dev` detects an AI coding agent but the block is missing.
 *
 * Keep the marker and block content in sync with:
 *   - packages/create-next-app/helpers/generate-agent-files.ts
 *   - packages/next-codemod/lib/agents-md.ts
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    AGENT_RULES_END_MARKER: null,
    AGENT_RULES_START_MARKER: null,
    hasCurrentAgentRules: null,
    writeAgentFiles: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    AGENT_RULES_END_MARKER: function() {
        return AGENT_RULES_END_MARKER;
    },
    AGENT_RULES_START_MARKER: function() {
        return AGENT_RULES_START_MARKER;
    },
    hasCurrentAgentRules: function() {
        return hasCurrentAgentRules;
    },
    writeAgentFiles: function() {
        return writeAgentFiles;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const AGENT_RULES_START_MARKER = '<!-- BEGIN:nextjs-agent-rules -->';
const AGENT_RULES_END_MARKER = '<!-- END:nextjs-agent-rules -->';
/**
 * Markers written by the pre-bundled-docs version of `agents-md`.
 * Stripped on upsert so projects that ran the old codemod end up with
 * a single current block instead of two stale-and-current blocks.
 */ const LEGACY_AGENT_RULES_START_MARKER = '<!-- NEXT-AGENTS-MD-START -->';
const LEGACY_AGENT_RULES_END_MARKER = '<!-- NEXT-AGENTS-MD-END -->';
function buildAgentRulesBlock() {
    return `${AGENT_RULES_START_MARKER}

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in \`node_modules/next/dist/docs/\` (resolved from this file's directory; in monorepos the \`next\` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by \`next dev\` — verify at \`node_modules/next/dist/server/lib/generate-agent-files.js\`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

${AGENT_RULES_END_MARKER}`;
}
const CLAUDE_MD_CONTENT = `@AGENTS.md\n`;
/**
 * Returns the managed block (markers included) found in `content`, or
 * `null` when the markers are absent or malformed.
 */ function extractAgentRulesBlock(content) {
    const start = content.indexOf(AGENT_RULES_START_MARKER);
    if (start === -1) return null;
    const end = content.indexOf(AGENT_RULES_END_MARKER, start);
    if (end === -1) return null;
    return content.slice(start, end + AGENT_RULES_END_MARKER.length);
}
function hasCurrentAgentRules(dir) {
    const block = buildAgentRulesBlock();
    for (const file of [
        'AGENTS.md',
        'CLAUDE.md'
    ]){
        const content = tryReadFile(_path.default.join(dir, file));
        if (!content) continue;
        const installed = extractAgentRulesBlock(content);
        if (installed !== null && normalizeEol(installed, '\n') === block) {
            return true;
        }
    }
    return false;
}
function writeAgentFiles(projectDir) {
    var _tryReadFile, _tryReadFile1;
    const agentsMdPath = _path.default.join(projectDir, 'AGENTS.md');
    const claudeMdPath = _path.default.join(projectDir, 'CLAUDE.md');
    const block = buildAgentRulesBlock();
    const agentsMdExists = _fs.default.existsSync(agentsMdPath);
    const claudeMdExists = _fs.default.existsSync(claudeMdPath);
    const claudeMdHostsBlock = claudeMdExists && (((_tryReadFile = tryReadFile(claudeMdPath)) == null ? void 0 : _tryReadFile.includes(AGENT_RULES_START_MARKER)) ?? false);
    const agentsMdHostsBlock = agentsMdExists && (((_tryReadFile1 = tryReadFile(agentsMdPath)) == null ? void 0 : _tryReadFile1.includes(AGENT_RULES_START_MARKER)) ?? false);
    if (agentsMdExists && (agentsMdHostsBlock || !claudeMdHostsBlock)) {
        return {
            agentsMd: upsertFile(agentsMdPath, block),
            claudeMd: 'skipped'
        };
    }
    if (claudeMdExists) {
        return {
            agentsMd: 'skipped',
            claudeMd: upsertFile(claudeMdPath, block)
        };
    }
    // Neither file exists — scaffold both, matching create-next-app.
    _fs.default.writeFileSync(agentsMdPath, block + '\n', 'utf-8');
    _fs.default.writeFileSync(claudeMdPath, CLAUDE_MD_CONTENT, 'utf-8');
    return {
        agentsMd: 'created',
        claudeMd: 'created'
    };
}
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function tryReadFile(filePath) {
    try {
        return _fs.default.readFileSync(filePath, 'utf-8');
    } catch  {
        return null;
    }
}
function upsertFile(filePath, block) {
    const existing = _fs.default.readFileSync(filePath, 'utf-8');
    const updated = upsertAgentRulesBlock(existing, block);
    if (updated === existing) return 'unchanged';
    _fs.default.writeFileSync(filePath, updated, 'utf-8');
    return 'updated';
}
/**
 * Detect the predominant line-ending style. Returns `'\r\n'` if any
 * CRLF is present, `'\n'` otherwise — avoids mixed EOLs on Windows.
 */ function detectEol(content) {
    return /\r\n/.test(content) ? '\r\n' : '\n';
}
function normalizeEol(s, eol) {
    return s.replace(/\r?\n/g, eol);
}
function upsertAgentRulesBlock(existing, block) {
    const eol = detectEol(existing);
    const normalizedBlock = normalizeEol(block, eol);
    existing = stripLegacyAgentRulesBlock(existing, eol);
    const startIdx = existing.indexOf(AGENT_RULES_START_MARKER);
    const endIdx = existing.indexOf(AGENT_RULES_END_MARKER);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const before = existing.slice(0, startIdx);
        const after = existing.slice(endIdx + AGENT_RULES_END_MARKER.length);
        const replaced = before + normalizedBlock + after;
        return replaced === existing ? existing : replaced;
    }
    const separator = existing.length === 0 || /\r?\n$/.test(existing) ? eol : eol + eol;
    return existing + separator + normalizedBlock + eol;
}
function stripLegacyAgentRulesBlock(existing, eol = '\n') {
    while(true){
        const startIdx = existing.indexOf(LEGACY_AGENT_RULES_START_MARKER);
        if (startIdx === -1) return existing;
        const endIdx = existing.indexOf(LEGACY_AGENT_RULES_END_MARKER, startIdx);
        if (endIdx === -1) return existing;
        let cutStart = startIdx;
        while(cutStart > 0 && /\s/.test(existing[cutStart - 1])){
            cutStart--;
        }
        let cutEnd = endIdx + LEGACY_AGENT_RULES_END_MARKER.length;
        while(cutEnd < existing.length && /\s/.test(existing[cutEnd])){
            cutEnd++;
        }
        const before = existing.slice(0, cutStart);
        const after = existing.slice(cutEnd);
        existing = before.length > 0 && after.length > 0 ? before + eol + eol + after : before + after;
    }
}

//# sourceMappingURL=generate-agent-files.js.map