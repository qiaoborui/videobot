import { SlashCommandBuilder } from "discord.js";
import { taskQueue } from "../schedule";
import { Status } from "../taskQueue";
import { getEnvVars } from "../utils";

export const command = {
  data: new SlashCommandBuilder()
    .setName("query_task")
    .setDescription("Query a task by taskId")
    .addStringOption((option) =>
      option
        .setName("task_id")
        .setDescription("The taskId of the task")
        .setRequired(true)
    ),
  async execute(interaction: any) {
    const admins = getEnvVars().ADMINS?.split(",");
    if (!admins?.includes(interaction.user.id)) {
      interaction.reply("You are not authorized to use this command");
      return;
    }
    const taskId = interaction.options.get("task_id")?.value as string;
    if (!taskId) {
      interaction.reply("Invalid input. Please provide a taskId.");
      return;
    }
    const task = await taskQueue.getTask(taskId);
    if (task) {
      interaction.reply(
        `Task ${taskId} has status ${task.status} and result ${task.result}`
      );
    } else {
      interaction.reply("Task not found");
    }
  },
};
