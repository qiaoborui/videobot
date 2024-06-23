import { SlashCommandBuilder } from "discord.js";
import { taskQueue } from "../schedule";
import { Status } from "../taskQueue";
import { getEnvVars } from "../utils";

export const command = {
  data: new SlashCommandBuilder()
    .setName("list_task")
    .setDescription("List all tasks")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Filter tasks by status")
        .setRequired(false)
        .addChoices(
          Object.values(Status).map((status) => ({
            name: status,
            value: status,
          }))
        )
    ),
  async execute(interaction: any) {
    const admins = getEnvVars().ADMINS?.split(",");
    if (!admins?.includes(interaction.user.id)) {
      interaction.reply("You are not authorized to use this command");
      return;
    }
    const status = interaction.options.get("status")?.value as Status;
    const tasks = await taskQueue.listTasks();
    if (status) {
      const filteredTasks = tasks.filter((task) => task.status === status);
      interaction.reply(
        `There are ${filteredTasks.length} tasks with status ${status}`
      );
    } else {
      interaction.reply(`There are ${tasks.length} tasks`);
    }
  },
};
