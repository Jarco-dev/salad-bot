import type { Client } from "@/classes";
import path from "path";
import fs from "fs";
import * as process from "process";
import cron from "node-cron";
import { Task as TaskStructure } from "@/structures";

export class TaskLoader {
    private client: Client;
    public tasks: {
        [cronExpression: string]: TaskStructure[];
    };
    public path: string;

    constructor(client: Client) {
        this.client = client;
        this.tasks = {};
        this.path = path.join(process.cwd(), "src", "tasks", "tasks");
    }

    public loadAllTasks(): void {
        // Get all the tasks
        const items = fs.readdirSync(this.path);
        for (const item of items) {
            // Skip the item if it's a folder
            if (fs.lstatSync(item).isDirectory()) continue;

            // Load the task
            try {
                // Require Task file
                const Task = require(path.join(this.path, item)).default;

                // Validate that it's a Task class
                if (!(Task.prototype instanceof TaskStructure)) {
                    continue;
                }

                // Add Task to corresponding list
                const task = new Task();
                if (task.enabled) {
                    if (task.cronExpression in this.tasks) {
                        this.tasks[task.cronExpression] = task;
                    } else {
                        this.tasks[task.cronExpression] = [task];
                    }
                }

                // Log loaded message
                this.client.logger.debug(`[TaskHandler] ${item} task loaded`);
            } catch (err) {
                this.client.logger.error(
                    `Error while trying to load timer task file ${item}`,
                    err
                );
            }
        }
    }

    public async startAll(): Promise<void> {
        for (const cronExpression in this.tasks) {
            try {
                const tasks = this.tasks[cronExpression];
                cron.schedule(cronExpression, () => {
                    for (const task of tasks) {
                        try {
                            this.client.logger.verbose(
                                `[TaskHandler] Running ${task.name}`
                            );
                            task.run();
                        } catch (err) {
                            this.client.logger.error(
                                `Error while running ${task.name}`
                            );
                        }
                    }
                });
            } catch (err) {
                this.client.logger.error(
                    "Error while starting a task timer",
                    err
                );
            }
        }
    }
}
