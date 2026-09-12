"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    PROFILES_DIR_NAME: null,
    ensureProfilesDir: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    PROFILES_DIR_NAME: function() {
        return PROFILES_DIR_NAME;
    },
    ensureProfilesDir: function() {
        return ensureProfilesDir;
    }
});
const _fs = require("fs");
const _path = require("path");
const PROFILES_DIR_NAME = '.next-profiles';
const GITIGNORE_CONTENTS = `# Created automatically by Next.js. Profiling output should not be committed.
*
`;
function ensureProfilesDir(dir) {
    const profilesDir = (0, _path.join)(dir, PROFILES_DIR_NAME);
    (0, _fs.mkdirSync)(profilesDir, {
        recursive: true
    });
    const gitignorePath = (0, _path.join)(profilesDir, '.gitignore');
    if (!(0, _fs.existsSync)(gitignorePath)) {
        try {
            (0, _fs.writeFileSync)(gitignorePath, GITIGNORE_CONTENTS);
        } catch  {
        // A missing .gitignore must not abort a profiling run.
        }
    }
    return profilesDir;
}

//# sourceMappingURL=profiles-dir.js.map