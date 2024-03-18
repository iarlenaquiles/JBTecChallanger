import 'dotenv/config';

const logger = (...args: any[]): void => {
    console.log(...args);
};

const delays = [...Array(50)].map(() => Math.floor(Math.random() * 900) + 100);
const load = delays.map(
    (delay): (() => Promise<number>) =>
        (): Promise<number> =>
            new Promise((resolve) => {
                setTimeout(() => resolve(Math.floor(delay / 100)), delay);
            })
);

type Task = () => Promise<number>;

const throttle = async (workers: number, tasks: Task[]): Promise<number[]> => {
    const results: number[] = [];
    const runningTasks: Promise<number>[] = [];

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        if (runningTasks.length < workers) {
            const taskPromise = task();
            runningTasks.push(taskPromise);

            taskPromise.then((result) => {
                results[i] = result;
                runningTasks.splice(runningTasks.indexOf(taskPromise), 1);
            });
        } else {
            await Promise.race(runningTasks);
            i--; // Retry this task since we now have a free worker
        }
    }

    await Promise.all(runningTasks); // Wait for all remaining tasks to finish

    return results;
};

const bootstrap = async (): Promise<void> => {
    logger('Starting...');
    const start = Date.now();
    try {
        const answers = await throttle(5, load);
        logger('Done in %dms', Date.now() - start);
        logger('Answers: %O', answers);
    } catch (err) {
        logger('General fail: %O', err);
    }
};

bootstrap().catch((err) => {
    logger('General fail: %O', err);
});
