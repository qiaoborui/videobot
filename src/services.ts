import { VideoInput } from "./types";
import { fetchWithRetry } from "./utils";
import { getEnvVars } from "./utils";
import {
  submitScriptTaskResponseSchema,
  promptResponseSchema,
  submitVideoTaskResponseSchema,
  checkStatusResponseSchema,
  scriptResponseSchema,
  ScriptResponse,
} from "./validators";

export async function fetchBotDetail(botUrl: string): Promise<{
  thumbnailURL: string;
  title: string;
}> {
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
  return parsedResponse.data.prompt;
}

export async function generateScriptGenerationTask(
  PlotPrompt: string,
  name: string,
  mainCharacterName: string,
  mainCharacterUrl: string
): Promise<string> {
  // log current step
  console.log("Generating script generation task");
  const lunaBackendUrl = getEnvVars().LUNABACKEND;
  const response = await fetchWithRetry(
    `${lunaBackendUrl}/api/SoraAPI/AddWorkflowData`,
    {
      method: "POST",
      body: JSON.stringify({
        PlotPrompt,
        name,
        mainCharacterName,
        mainCharacterUrl,
        workflowID: getEnvVars().LUNAWORKFLOWID,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );
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
  console.log("Script generation task created with ID:", taskId);
  return taskId;
}

export async function getScriptGenerationResult(
  taskId: string
): Promise<VideoInput> {
  console.log("Checking script generation status");
  let resp: ScriptResponse;
  while (true) {
    const taskResponse = await fetchWithRetry(
      `${getEnvVars().LUNABACKEND}/api/SoraAPI/CheckWorkflowStatus`,
      {
        method: "POST",
        body: JSON.stringify({ id: taskId }),
        headers: { "Content-Type": "application/json" },
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
      console.log("Script generation completed");
      // use z to parse the response
      const parsedResponse = scriptResponseSchema.safeParse(res);
      if (!parsedResponse.success) {
        throw new Error(parsedResponse.error.errors.join("\n"));
      }
      resp = parsedResponse.data;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  try {
    const finalMegePos: number = 5;
    const characterPos: number = 6;
    const musicPos: number = 7;
    const voicePos: number = 8;

    // get the shots
    const shotsOriginal = JSON.parse(
      resp.data.workflowData.timeline[finalMegePos].steps[
        resp.data.workflowData.timeline[finalMegePos].steps.length - 1
      ].value
    );
    //
    let shots = [];
    if (Array.isArray(shotsOriginal)) {
      shots = shotsOriginal[0].shots;
    } else {
      shots = shotsOriginal.shots;
    }
    // 遍历 shots，将每个 shot 的 shot_number 转换为 number
    shots = shots.map((shot: any) => {
      shot.shot_number = Number(shot.shot_number);
      return shot;
    });

    // get the voice map
    const voiceArray = JSON.parse(
      resp.data.workflowData.timeline[voicePos].steps[
        resp.data.workflowData.timeline[voicePos].steps.length - 1
      ].value
    );
    const voiceMap = voiceArray.reduce((acc: any, cur: any) => {
      acc[cur.characterName] = cur.id;
      return acc;
    }, {});

    // get the character map
    const characterMap = JSON.parse(
      resp.data.workflowData.timeline[characterPos].steps[
        resp.data.workflowData.timeline[characterPos].steps.length - 1
      ].value
    );

    // get the background music
    const backgroundMusic = JSON.parse(
      resp.data.workflowData.timeline[musicPos].steps[
        resp.data.workflowData.timeline[musicPos].steps.length - 1
      ].value
    ).name;

    const input: VideoInput = {
      videoInput: {
        shots: shots,
      },
      characterMap: characterMap,
      voiceMap: voiceMap,
      options: {
        background_music: backgroundMusic,
      },
    };
    console.log("Script generation result:", input);
    return input;
  } catch (error) {
    console.error("Error in getting script generation result:", error);
    throw error;
  }
}

export async function generateVideoGenerationTask(
  scripts: VideoInput
): Promise<string> {
  console.log("Generating video generation task");
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
  console.log(
    "Video generation task created with ID:",
    parsedResponse.data.taskId
  );
  return parsedResponse.data.taskId;
}

export async function getVideoGenerationResult(
  taskId: string
): Promise<string> {
  console.log("Checking video generation status");
  try {
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
        console.log("Video generation completed");
        return parsedResponse.data.result!.file!;
      }
      if (parsedResponse.data.status === "failed") {
        console.error(
          "Video generation failed:",
          parsedResponse.data.result!.err
        );
        throw new Error(parsedResponse.data.result!.err);
      }
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  } catch (error) {
    console.error("Error in getting video generation result:", error);
    throw error;
  }
}
