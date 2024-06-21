import Redis from "ioredis";
import { userInputSchema } from "./types";
import { z } from "zod";
export interface Task {
  id: string;
  userId: string;
  channelId: string;
  status: Status;
  result?: any;
  queueAt?: number;
  data: z.infer<typeof userInputSchema>;
  retryCount: number;
}

export enum Status {
  QUEUED = "queued",
  GENERATING_SCRIPT = "generating_script",
  GENERATING_VIDEO = "generating_video",
  DONE = "done",
  FAILED = "failed",
}

export class TaskQueue {
  private redis: Redis;
  private key: string;

  constructor(redis: Redis, key: string) {
    this.redis = redis;
    this.key = key;
  }

  async queueTask(task: Task): Promise<void> {
    await this.redis.hset(this.key, task.id, JSON.stringify(task));
  }

  async updateTaskStatus(taskId: string, status: Status): Promise<void> {
    const task = await this.getTask(taskId);
    if (task) {
      task.status = status;
      await this.redis.hset(this.key, taskId, JSON.stringify(task));
    }
  }

  async updateTaskResult(taskId: string, result: any): Promise<void> {
    const task = await this.getTask(taskId);
    if (task) {
      task.result = result;
      await this.redis.hset(this.key, taskId, JSON.stringify(task));
    }
  }

  async addRetryCount(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (task) {
      task.retryCount += 1;
      await this.redis.hset(this.key, taskId, JSON.stringify(task));
    }
  }

  async listTasks(): Promise<Task[]> {
    const tasks = await this.redis.hvals(this.key);
    return tasks.map((task) => JSON.parse(task));
  }

  async getTaskStatus(taskId: string): Promise<string | null> {
    const task = await this.getTask(taskId);
    return task ? task.status : null;
  }

  async getTaskResult(taskId: string): Promise<any | null> {
    const task = await this.getTask(taskId);
    return task ? task.result : null;
  }

  async setTaskData(taskId: string, data: any): Promise<void> {
    const task = await this.getTask(taskId);
    if (task) {
      task.data = data;
      await this.redis.hset(this.key, taskId, JSON.stringify(task));
    }
  }

  async getTaskQueueAt(taskId: string): Promise<any | null> {
    const task = await this.getTask(taskId);
    return task ? task.queueAt : null;
  }

  async getTask(taskId: string): Promise<Task | null> {
    const taskJson = await this.redis.hget(this.key, taskId);
    return taskJson ? JSON.parse(taskJson) : null;
  }
}
