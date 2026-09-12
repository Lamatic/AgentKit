/**
 * This is a utility function to make scheduling sequential tasks that run back to back easier.
 * We schedule on the same queue (setTimeout) at the same time to ensure no other events can sneak in between.
 *
 * The first function runs in the first task. Each subsequent function runs in its own task.
 * The returned promise resolves after the last task completes.
 */
export declare function runInSequentialTasks<R>(first: () => R, ...rest: Array<() => void>): Promise<Awaited<R>>;
