// 导入所需的模块
import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  Collection,
} from "discord.js";
import { getEnvVars } from "./utils";
import fs from "fs";
import { checkAndUpdateTasks } from "./schedule";
import { command as generateCommand } from "./commands/generate";
import { command as listTaskCommand } from "./commands/listTask";
import { command as queryTaskCommand } from "./commands/queryTask";
interface CustomClient extends Client {
  commands?: Collection<string, any>;
}

const TOKEN = getEnvVars().TOKEN;
const CLIENT_ID = getEnvVars().CLIENT_ID;

export const client: CustomClient = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
client.commands.set(generateCommand.data.name, generateCommand);
client.commands.set(listTaskCommand.data.name, listTaskCommand);
client.commands.set(queryTaskCommand.data.name, queryTaskCommand);
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("Started refreshing application (/) commands.");
    // 根据命令集合注册命令
    const commands = client.commands!.map((command) => command.data.toJSON());
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });
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
    const { commandName } = interaction;
    const command = client.commands!.get(commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
    // const command = interaction.commandName;
    // if (command === "generate") {
    //   // get the prompt and bot url from the interaction
    //   const prompt = interaction.options.get("story")?.value as string;
    //   const maincharacter = interaction.options.get("maincharacter")
    //     ?.value as string;
    //   const boturl = interaction.options.get("boturl")?.value as string;
    //   if (!prompt || !boturl || !maincharacter) {
    //     interaction.reply(
    //       "Invalid input. Please provide a prompt, bot url and main character."
    //     );
    //     return;
    //   }
    //   const taskId = uuidv4();
    //   if (!interaction.channel) {
    //     interaction.reply("Please use this command in a server channel.");
    //     return;
    //   }
    //   console.log(interaction.user.id);
    //   taskQueue.queueTask({
    //     id: taskId,
    //     userId: interaction.user.id,
    //     channelId: interaction.channel.id,
    //     status: Status.QUEUED,
    //     queueAt: Date.now(),
    //     data: {
    //       prompt,
    //       boturl,
    //       maincharacter,
    //     },
    //     retryCount: 0,
    //   });
    //   // reply with the input and the task id
    //   interaction.reply(
    //     `Task ${taskId} queued. \nPrompt: ${prompt}, Bot URL: ${boturl}, Main Character: ${maincharacter}`
    //   );
    // }
  });
  client.login(TOKEN);
  setInterval(() => {
    checkAndUpdateTasks();
  }, 5000);
}

main();
