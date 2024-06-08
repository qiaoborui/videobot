import fetch from "node-fetch";
import { Response } from "node-fetch";
import * as dotenv from "dotenv";
import { envVarsSchema } from "./types";
import Redis from "ioredis";
import { Task } from "./taskQueue";
import { writeFile } from "fs/promises";
export async function fetchWithRetry(
  url: string,
  options = {},
  retryTimes = 5
): Promise<Response> {
  let retries = 0;
  while (retries < retryTimes) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} - ${await response.text()}`
        );
      }
      return response;
    } catch (e) {
      console.error(`Failed to fetch ${url}, retrying...`);
      console.error(e);
      retries++;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Failed to fetch ${url} after ${retryTimes} retries`);
}
export function getEnvVars() {
  dotenv.config();
  const envVars = process.env;
  const parsedEnvVars = envVarsSchema.safeParse(envVars);
  if (!parsedEnvVars.success) {
    throw new Error(parsedEnvVars.error.errors.join("\n"));
  }
  return parsedEnvVars.data;
}
export function logCurrentStep(task: Task, step: string, details?: any) {
  const userId = task.userId;
  const prompt = task.data.prompt;
  const boturl = task.data.boturl;
  // print a table with the task details
  console.table({ userId, prompt, boturl, step, details });
}

export async function downloadMedia(url: string, filePath: string) {
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const buffer = await response.buffer();
  await writeFile(filePath, buffer);
}
const { REDIS_CLOUD_URL } = getEnvVars();
export const redisClient = new Redis(REDIS_CLOUD_URL);
