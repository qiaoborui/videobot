import { VideoInput } from "./types";
import { fetchWithRetry } from "./utils";
import { getEnvVars } from "./utils";
import {
  submitScriptTaskResponseSchema,
  promptResponseSchema,
  submitVideoTaskResponseSchema,
  checkStatusResponseSchema,
} from "./validators";

export async function fetchBotImageUrl(botUrl: string): Promise<string> {
  if (!botUrl.startsWith("https://flowgpt.com/p/")) {
    throw new Error("Invalid bot URL");
  }
  const botId = botUrl.split("/").pop();
  if (!botId) {
    throw new Error("Invalid bot URL");
  }
  const flowBackendUrl = getEnvVars().FLOWBACKEND;
  const apiUrl = `${flowBackendUrl}/prompt/${botId}`;
  const response = await fetchWithRetry(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch bot image");
  }
  const responseBody = await response.json();
  const parsedResponse = promptResponseSchema.safeParse(responseBody);
  if (!parsedResponse.success) {
    throw new Error(parsedResponse.error.errors.join("\n"));
  }
  return parsedResponse.data.prompt.thumbnailURL;
}

export async function generateScriptGenerationTask(
  prompt: string
): Promise<string> {
  const lunaBackendUrl = getEnvVars().LUNABACKEND;
  const response = await fetchWithRetry(lunaBackendUrl, {
    method: "POST",
    body: JSON.stringify({
      PlotPrompt: prompt,
      workflowID: getEnvVars().LUNAWORKFLOWID,
      name: "Script Generation",
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to generate task");
  }
  // use z to parse the response
  const responseBody = await response.json();
  const parsedResponse = submitScriptTaskResponseSchema.safeParse(responseBody);
  if (!parsedResponse.success) {
    throw new Error(parsedResponse.error.errors.join("\n"));
  }
  const taskId = parsedResponse.data.data.workflowID;

  return taskId;
}

export async function getScriptGenerationResult(
  taskId: string,
  botUrl: string
): Promise<VideoInput> {
  while (true) {
    const taskResponse = await fetchWithRetry(
      `${getEnvVars().LUNABACKEND}/api/SoraAPI/CheckWorkflowStatus`,
      {
        method: "POST",
        body: JSON.stringify({ id: taskId }),
      }
    );
    const res: any = await taskResponse.json();
    if (
      res.data.workflowData.timeline[res.data.workflowData.timeline.length - 1]
        .steps[
        res.data.workflowData.timeline[
          res.data.workflowData.timeline.length - 1
        ].steps.length - 1
      ].value !== ""
    ) {
      const mainCharacterImage = await fetchBotImageUrl(botUrl);
      if (!mainCharacterImage) {
        throw new Error("Failed to fetch bot image");
      }
      // TODO: combination of the steps
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

export async function generateVideoGenerationTask(
  scripts: VideoInput
): Promise<string> {
  const videoGenerationUrl = `${
    getEnvVars().FLOWBACKEND
  }/creator/internal/video-generation/queue`;
  const response = await fetchWithRetry(videoGenerationUrl, {
    method: "POST",
    body: JSON.stringify(scripts),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to generate video");
  }
  const responseBody = await response.json();
  const parsedResponse = submitVideoTaskResponseSchema.safeParse(responseBody);
  if (!parsedResponse.success) {
    throw new Error(parsedResponse.error.errors.join("\n"));
  }
  return parsedResponse.data.taskId;
}

export async function getVideoGenerationResult(
  taskId: string
): Promise<string> {
  while (true) {
    const videoGenerationUrl = `${
      getEnvVars().FLOWBACKEND
    }/creator/internal/video-generation/result`;
    const response = await fetchWithRetry(videoGenerationUrl, {
      method: "POST",
      body: JSON.stringify({ taskId }),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to check task status");
    }
    const responseBody = await response.json();
    const parsedResponse = checkStatusResponseSchema.safeParse(responseBody);
    if (!parsedResponse.success) {
      throw new Error(parsedResponse.error.errors.join("\n"));
    }
    if (parsedResponse.data.status === "finished") {
      return parsedResponse.data.result.file!;
    }
  }
}
