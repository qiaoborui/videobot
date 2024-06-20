import { SlashCommandBuilder } from "discord.js";
import { taskQueue } from "../schedule";
import { Status } from "../taskQueue";
import { v4 as uuidv4 } from "uuid";
import { personaArr } from "../utils";

// use map to create the choices array
const personaChoices = personaArr.map((persona) => [
  persona.characterList[0].name,
  persona.bot,
]);

export const command = {
  data: new SlashCommandBuilder()
    .setName("generate")
    .setDescription("generate a video!")
    .addStringOption((option) =>
      option
        .setName("bot")
        .setDescription("The gif category")
        .setRequired(true)
        .addChoices(
          personaChoices.map((choice) => ({
            name: choice[0],
            value: choice[1],
          }))
        )
    )
    .addStringOption((option) =>
      option
        .setName("story")
        .setDescription("The prompt for the video generation.")
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const prompt = interaction.options.get("story")?.value as string;
    const bot = interaction.options.get("bot")?.value as string;
    console.log("prompt", prompt);
    console.log("bot", bot);
    if (!prompt || !bot) {
      interaction.reply("Invalid input. Please provide a prompt and bot url.");
      return;
    }
    const taskId = uuidv4();
    const persona = personaArr.find((persona) => persona.bot === bot);
    if (!interaction.channel) {
      interaction.reply("Please use this command in a server channel.");
      return;
    }
    let channels = ["1252962035264913459"];
    if (!channels.includes(interaction.channel.id)) {
      interaction.reply("Please use this command in a server channel.");
      return;
    }
    const userId = interaction.user.id;
    // 在 task 中查找是否有相同的 userId，如果有，返回
    const tasks = await taskQueue.listTasks();
    const userTasks = tasks.filter((task) => task.userId === userId);
    const userActiveTasks = userTasks.filter(
      (task) =>
        task.status == Status.QUEUED ||
        task.status == Status.GENERATING_SCRIPT ||
        task.status == Status.GENERATING_VIDEO
    );
    if (userActiveTasks.length > 0) {
      interaction.reply(
        "You have an active task. Please wait for it to finish."
      );
      return;
    }
    console.log(interaction.user.id);
    await taskQueue.queueTask({
      id: taskId,
      userId: interaction.user.id,
      channelId: interaction.channel.id,
      status: Status.QUEUED,
      queueAt: Date.now(),
      data: {
        prompt,
        boturl: bot,
        options: persona,
      },
      retryCount: 0,
    });
    // reply with the input and the task id
    interaction.reply(
      `Task ${taskId} queued. \nPrompt: ${prompt}, Bot URL: ${bot}`
    );
  },
};
