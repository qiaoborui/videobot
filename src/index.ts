// 导入所需的模块
import { REST, Routes, Client, GatewayIntentBits } from "discord.js";
import { commands } from "./types";
import { getEnvVars } from "./utils";
import {
  generateScriptGenerationTask,
  generateVideoGenerationTask,
  getScriptGenerationResult,
  getVideoGenerationResult,
} from "./services";
import { TaskQueue, Status, Task } from "./taskQueue";
import { redisClient } from "./utils";
import { v4 as uuidv4 } from "uuid";
const TOKEN = getEnvVars().TOKEN;
const CLIENT_ID = getEnvVars().CLIENT_ID;
const taskQueue = new TaskQueue(redisClient, "discord-bot-tasks");
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

  client.on("ready", () => {});
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.commandName;
    if (command === "generate") {
      // get the prompt and bot url from the interaction
      const prompt = interaction.options.get("prompt")?.value as string;
      const boturl = interaction.options.get("boturl")?.value as string;
      if (!prompt || !boturl) {
        interaction.reply("Please provide a prompt and bot url.");
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
        prompt,
        boturl,
      });
      interaction.reply(`Job queued with ID: ${taskId}`);
    }
  });
  client.login(TOKEN);
}
// use client to send a msg to the user

main();
// setInterval(() => {
//   checkAndUpdateTasks();
// }, 5000);

// async function checkAndUpdateTasks() {
//   try {
//     const tasks = await taskQueue.listTasks();
//     tasks.forEach((task) => processTask(task));
//   } catch (error) {
//     console.error("Failed to list or process tasks:", error);
//   }
// }

// async function processTask(task: Task) {
//   if (!taskMemory.includes(task.id) && task.status === Status.QUEUED) {
//     taskMemory.push(task.id);
//     await updateTaskStatus(task.id, Status.GENERATING_SCRIPT);
//     handleScriptGeneration(task);
//   }
//   if (taskMemory.includes(task.id) && task.status === Status.DONE) {
//     // send result to user by task.userId
//   }
// }

// async function handleScriptGeneration(task: Task) {
//   try {
//     //const scriptTaskId = await generateScriptGenerationTask(task.prompt);
//     // const scriptResult = await getScriptGenerationResult(
//     //   scriptTaskId,
//     //   task.boturl
//     // );
//     await handleVideoGeneration(task, "scriptResult");
//   } catch (error) {
//     console.error("Script generation failed:", error);
//     await updateTaskStatus(task.id, Status.FAILED);
//   }
// }

// async function handleVideoGeneration(task: Task, scriptResult) {
//   try {
//     //const videoTaskId = await generateVideoGenerationTask(scriptResult);
//     //await getVideoGenerationResult(videoTaskId);
//     await updateTaskStatus(task.id, Status.DONE);
//   } catch (error) {
//     console.error("Video generation failed:", error);
//     await updateTaskStatus(task.id, Status.FAILED);
//   }
// }

// async function updateTaskStatus(taskId, status: Status) {
//   try {
//     await taskQueue.updateTaskStatus(taskId, status);
//   } catch (error) {
//     console.error(`Failed to update status for task ${taskId}:`, error);
//   }
// }
setInterval(() => {
  checkAndUpdateTasks();
}, 1000);

async function checkAndUpdateTasks() {
  try {
    const tasks = await taskQueue.listTasks();
    tasks.forEach((task) => processTask(task));
  } catch (error) {
    console.error("Failed to list or process tasks:", error);
  }
}

async function processTask(task: Task) {
  if (!taskMemory.includes(task.id) && task.status === Status.QUEUED) {
    console.log(`Processing task ${task.id} for user ${task.userId}`);
    taskMemory.push(task.id);
    await updateTaskStatus(task.id, Status.GENERATING_SCRIPT);
    handleScriptGeneration(task);
  }
  if (taskMemory.includes(task.id) && task.status === Status.DONE) {
    console.log(`Task ${task.id} for user ${task.userId} is done.`);
    taskMemory.splice(taskMemory.indexOf(task.id), 1);
    client.login(TOKEN);
    client.users
      .fetch(task.userId)
      .then((user) => {
        user.send("Your video is ready!");
      })
      .catch((error) => {
        console.error("Failed to send message to user:", error);
      });
    client.login(TOKEN);
  }
}

async function handleScriptGeneration(task: Task) {
  try {
    setTimeout(async () => {
      await handleVideoGeneration(task, "scriptResult");
    }, 2000); // 模拟脚本生成
  } catch (error) {
    console.error("Script generation failed:", error);
    await updateTaskStatus(task.id, Status.FAILED);
  }
}

async function handleVideoGeneration(task: Task, scriptResult: string) {
  try {
    setTimeout(async () => {
      await updateTaskStatus(task.id, Status.DONE);
    }, 3000); // 模拟视频生成
  } catch (error) {
    console.error("Video generation failed:", error);
    await updateTaskStatus(task.id, Status.FAILED);
  }
}

async function updateTaskStatus(taskId: string, status: Status) {
  try {
    await taskQueue.updateTaskStatus(taskId, status);
  } catch (error) {
    console.error(`Failed to update status for task ${taskId}:`, error);
  }
}
