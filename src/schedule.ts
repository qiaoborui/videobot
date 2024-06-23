import { TaskQueue, Task, Status } from "./taskQueue";
import { redisClient } from "./utils";
import {
  fetchBotDetail,
  generateScriptGenerationTask,
  getScriptGenerationResultSD,
  generateVideoGenerationTask,
  getVideoGenerationResult,
} from "./services";
import { downloadMedia } from "./utils";
import { client } from "./index";
export const taskQueue = new TaskQueue(redisClient, "discord-bot-tasks");
export const taskMemory: string[] = [];
export async function checkAndUpdateTasks() {
  try {
    const tasks = await taskQueue.listTasks();
    const taskWorking = tasks.filter(
      (task) =>
        task.status === Status.QUEUED ||
        task.status === Status.GENERATING_SCRIPT ||
        task.status === Status.GENERATING_VIDEO
    ).length;
    const taskInProgress = taskMemory.length;
    if (
      taskWorking !== statusTable.taskWorking ||
      taskInProgress !== statusTable.taskInProgress
    ) {
      console.table({ taskWorking, taskInProgress });
      statusTable.taskWorking = taskWorking;
      statusTable.taskInProgress = taskInProgress;
    }
    tasks.forEach((task) => processTask(task));
  } catch (error) {
    console.error("Failed to list or process tasks:", error);
  }
}
let statusTable = {
  taskWorking: 0,
  taskInProgress: 0,
};
async function processTask(task: Task) {
  try {
    // check if task is not already being processed and is in QUEUED status
    if (!taskMemory.includes(task.id) && task.status === Status.QUEUED) {
      console.log(`Processing task ${task.id} for user ${task.userId}`);
      taskMemory.push(task.id);
      await updateTaskStatus(task.id, Status.GENERATING_SCRIPT);
      handleScriptGeneration(task);
    }
    // check if task is in memory and is done
    if (
      taskMemory.includes(task.id) &&
      task.status === Status.DONE &&
      task.result
    ) {
      console.log(`Task ${task.id} for user ${task.userId} is done.`);
      taskMemory.splice(taskMemory.indexOf(task.id), 1);
      // download the result to videos directory
      const videoPath = `./videos/${task.id}.mp4`;
      console.log("result", task.result);
      await downloadMedia(task.result, videoPath);
      await replyToUserInChannel(
        task.channelId,
        task.userId,
        "Your video is ready.",
        videoPath
      );
    }
    // check if task is in memory and has failed
    if (
      taskMemory.includes(task.id) &&
      task.status === Status.FAILED &&
      task.retryCount >= 2
    ) {
      console.log(`Task ${task.id} for user ${task.userId} failed.`);
      taskMemory.splice(taskMemory.indexOf(task.id), 1);
      await replyToUserInChannel(
        task.channelId,
        task.userId,
        "Failed to generate video."
      );
    }
    // check if task is in memory and has failed
    if (
      taskMemory.includes(task.id) &&
      task.status === Status.FAILED &&
      task.retryCount < 2
    ) {
      console.log(`Task ${task.id} for user ${task.userId} failed.`);
      console.log(`Retrying task ${task.id} for user ${task.userId}`);
      taskMemory.splice(taskMemory.indexOf(task.id), 1);
      await updateTaskStatus(task.id, Status.QUEUED);
    }
    // check if task is not in memory and is generating video
    if (
      !taskMemory.includes(task.id) &&
      task.status === Status.GENERATING_VIDEO &&
      task.data.videoInput
    ) {
      await handleVideoGeneration(task);
    }
    if (
      !taskMemory.includes(task.id) &&
      task.status === Status.GENERATING_VIDEO
    ) {
      await updateTaskStatus(task.id, Status.QUEUED);
    }
    if (
      !taskMemory.includes(task.id) &&
      task.status === Status.GENERATING_SCRIPT
    ) {
      await updateTaskStatus(task.id, Status.QUEUED);
    }
  } catch (error) {
    console.error("Failed to process task:", error);
  }
}

async function handleScriptGeneration(task: Task) {
  try {
    console.log("handleScriptGeneration");
    //await fetchBotDetail(task);
    await generateScriptGenerationTask(task);
    await getScriptGenerationResultSD(task);
    await handleVideoGeneration(task);
  } catch (error) {
    console.error("Script generation failed:", JSON.stringify(error));
    await updateTaskStatus(task.id, Status.FAILED);
    await taskQueue.addRetryCount(task.id);
  }
}

async function handleVideoGeneration(task: Task) {
  try {
    console.log("handleVideoGeneration");
    await updateTaskStatus(task.id, Status.GENERATING_VIDEO);
    await generateVideoGenerationTask(task);
    await getVideoGenerationResult(task);
    await updateTaskStatus(task.id, Status.DONE);
  } catch (error: any) {
    console.error("Video generation failed:", error.message);
    await updateTaskStatus(task.id, Status.FAILED);
    await taskQueue.addRetryCount(task.id);
  }
}

async function updateTaskStatus(taskId: string, status: Status) {
  try {
    await taskQueue.updateTaskStatus(taskId, status);
  } catch (error) {
    console.error(`Failed to update status for task ${taskId}:`, error);
  }
}

async function replyToUserInChannel(
  channelId: string,
  userId: string,
  message: string,
  file?: string
) {
  const channel = await client.channels.fetch(channelId);
  if (channel && channel.isTextBased()) {
    if (file) {
      channel.send({
        content: `<@${userId}> ${message}`,
        files: [file],
      });
    } else {
      channel.send(`<@${userId}> ${message}`);
    }
  }
}
