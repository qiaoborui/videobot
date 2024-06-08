// 导入所需的模块
import { REST, Routes, Client, GatewayIntentBits } from "discord.js";
import { commands } from "./types";
import { getEnvVars, downloadMedia } from "./utils";
import {
  generateScriptGenerationTask,
  generateVideoGenerationTask,
  getScriptGenerationResult,
  getVideoGenerationResult,
  fetchBotDetail,
} from "./services";
import { TaskQueue, Status, Task } from "./taskQueue";
import { redisClient } from "./utils";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
const TOKEN = getEnvVars().TOKEN;
const CLIENT_ID = getEnvVars().CLIENT_ID;
export const taskQueue = new TaskQueue(redisClient, "discord-bot-tasks");
const taskMemory: string[] = [];
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
async function main() {
  registerCommands();
  // check directory videos exists if not create it
  const videosDir = "./videos";
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir);
  }
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.commandName;
    if (command === "generate") {
      // get the prompt and bot url from the interaction
      const prompt = interaction.options.get("story")?.value as string;
      const maincharacter = interaction.options.get("maincharacter")
        ?.value as string;
      const boturl = interaction.options.get("boturl")?.value as string;
      if (!prompt || !boturl || !maincharacter) {
        interaction.reply(
          "Invalid input. Please provide a prompt, bot url and main character."
        );
        return;
      }
      const taskId = uuidv4();
      if (!interaction.channel) {
        interaction.reply("Please use this command in a server channel.");
        return;
      }
      console.log(interaction.user.id);
      taskQueue.queueTask({
        id: taskId,
        userId: interaction.user.id,
        channelId: interaction.channel.id,
        status: Status.QUEUED,
        queueAt: Date.now(),
        data: {
          prompt,
          boturl,
          maincharacter,
        },
        retryCount: 0,
      });
      interaction.reply(`Job queued with ID: ${taskId}`);
    }
  });
  client.login(TOKEN);
}

main();

setInterval(() => {
  checkAndUpdateTasks();
}, 10000);
let statusTable = {
  taskWorking: 0,
  taskInProgress: 0,
};
async function checkAndUpdateTasks() {
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
  } catch (error) {
    console.error("Failed to process task:", error);
  }
}

async function handleScriptGeneration(task: Task) {
  try {
    await fetchBotDetail(task);
    await generateScriptGenerationTask(task);
    await getScriptGenerationResult(task);
    await handleVideoGeneration(task);
  } catch (error) {
    console.error("Script generation failed:", error);
    await updateTaskStatus(task.id, Status.FAILED);
    task.retryCount += 1;
  }
}

async function handleVideoGeneration(task: Task) {
  try {
    await updateTaskStatus(task.id, Status.GENERATING_VIDEO);
    await generateVideoGenerationTask(task);
    await getVideoGenerationResult(task);
    await updateTaskStatus(task.id, Status.DONE);
  } catch (error: any) {
    console.error("Video generation failed:", error.message);
    await updateTaskStatus(task.id, Status.FAILED);
    task.retryCount += 1;
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
