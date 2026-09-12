export type RootBoundary = {
    boundary: string;
    marker: string;
    root: string;
    type: 'repository' | 'home';
};
export declare function findRootDirAndLockFiles(cwd: string): {
    lockFiles: string[];
    rootDir: string;
    boundary?: RootBoundary;
};
export declare function warnDuplicatedLockFiles(lockFiles: string[]): void;
export declare function warnRootBoundary({ boundary, marker, root, type, }: RootBoundary): void;
