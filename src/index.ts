// 导入所需的模块
import { REST, Routes, Client, GatewayIntentBits } from "discord.js";
import { commands } from "./types";
import { getEnvVars } from "./utils";
import { Status } from "./taskQueue";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { checkAndUpdateTasks, taskQueue } from "./schedule";

const TOKEN = getEnvVars().TOKEN;
const CLIENT_ID = getEnvVars().CLIENT_ID;

export const client = new Client({ intents: [GatewayIntentBits.Guilds] });
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
      // reply with the input and the task id
      interaction.reply(
        `Task ${taskId} queued. \nPrompt: ${prompt}, Bot URL: ${boturl}, Main Character: ${maincharacter}`
      );
    }
  });
  client.login(TOKEN);
  setInterval(() => {
    checkAndUpdateTasks();
  }, 10000);
}

main();
