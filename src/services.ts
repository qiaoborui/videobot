import { Task } from "./taskQueue";
import { VideoInputSchema } from "./types";
import { fetchWithRetry, logCurrentStep, getEnvVars } from "./utils";
import {
  submitScriptTaskResponseSchema,
  promptResponseSchema,
  submitVideoTaskResponseSchema,
  checkStatusResponseSchema,
  scriptResponseSchema,
  ScriptResponse,
} from "./validators";
import { taskQueue } from "./schedule";

export async function fetchBotDetail(task: Task): Promise<void> {
  logCurrentStep(task, "Fetching bot details");
  if (!task.data.boturl.startsWith("https://flowgpt.com/p/")) {
    throw new Error("Invalid bot URL");
  }
  const botId = task.data.boturl.split("/").pop();
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
  task.data.maincharacterurl = parsedResponse.data.prompt.thumbnailURL;
}

export async function generateScriptGenerationTask(task: Task): Promise<void> {
  logCurrentStep(task, "Generating script");
  const lunaBackendUrl = getEnvVars().LUNABACKEND;
  const response = await fetchWithRetry(
    `${lunaBackendUrl}/api/SoraAPI/AddWorkflowData`,
    {
      method: "POST",
      body: JSON.stringify({
        PlotPrompt: task.data.prompt,
        name: `${task.data.maincharacter}\n ${new Date().toISOString()}\n ${
          task.userId
        }`,
        mainCharacterName: task.data.maincharacter,
        mainCharacterUrl: task.data.maincharacterurl,
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
  const data = task.data;
  data.lunaTaskId = taskId;
  taskQueue.setTaskData(task.id, data);
}

export async function generateScriptGenerationTaskSD(
  task: Task
): Promise<void> {
  logCurrentStep(task, "Generating script");
  const lunaBackendUrl = getEnvVars().LUNABACKEND;
  const response = await fetchWithRetry(
    `${lunaBackendUrl}/api/SoraAPI/AddWorkflowData`,
    {
      method: "POST",
      body: JSON.stringify({
        createType: "sd",
        PlotPrompt: task.data.prompt,
        name: `${new Date().toISOString()}\n ${task.userId}`,
        mainCharacterName: "",
        mainCharacterUrl: "",
        enableSvd: true,
        workflowID: getEnvVars().LUNAWORKFLOWID,
        characterList: task.data.options.characterList,
        sdOption: task.data.options.sdOption,
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
  const data = task.data;
  data.lunaTaskId = taskId;
  taskQueue.setTaskData(task.id, data);
}

export async function getScriptGenerationResult(task: Task): Promise<void> {
  logCurrentStep(task, "Checking script generation status");
  let resp: ScriptResponse;
  const startTime = Date.now();
  while (true) {
    const taskResponse = await fetchWithRetry(
      `${getEnvVars().LUNABACKEND}/api/SoraAPI/CheckWorkflowStatus`,
      {
        method: "POST",
        body: JSON.stringify({ id: task.data.lunaTaskId }),
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
    if (Date.now() - startTime > 30 * 60 * 1000) {
      throw new Error("Script generation timed out");
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
    const characterMapOrigin = JSON.parse(
      resp.data.workflowData.timeline[characterPos].steps[
        resp.data.workflowData.timeline[characterPos].steps.length - 1
      ].value
    );
    // 判断是数组还是对象
    let characterMap;
    if (Array.isArray(characterMapOrigin)) {
      characterMap = characterMapOrigin[0];
    } else {
      characterMap = characterMapOrigin;
    }
    // 检查主角是否有 url 先判断是否有 url 这个属性，再判断是否有值,如果没有，就用 task.data.maincharacterurl
    if (
      !characterMap[task.data.maincharacter!] ||
      !characterMap[task.data.maincharacter!].url
    ) {
      characterMap[task.data.maincharacter!].url = task.data.maincharacterurl;
    }
    delete characterMap["banned word identified"];

    // get the background music
    const backgroundMusic = JSON.parse(
      resp.data.workflowData.timeline[musicPos].steps[
        resp.data.workflowData.timeline[musicPos].steps.length - 1
      ].value
    ).name;

    const inputdata = {
      videoInput: {
        shots: shots,
      },
      characterMap: characterMap,
      voiceMap: voiceMap,
      options: {
        background_music: backgroundMusic,
      },
    };
    // use z to parse the response
    const input = JSON.stringify(inputdata);
    const parsedResponse = VideoInputSchema.safeParse(JSON.parse(input));
    if (!parsedResponse.success) {
      throw new Error(parsedResponse.error.errors.join("\n"));
    }
    console.log("Script generation completed:", parsedResponse.data);
    const data = task.data;
    data.videoInput = parsedResponse.data;
    taskQueue.setTaskData(task.id, data);
  } catch (error) {
    console.error("Error in getting script generation result:", error);
    throw error;
  }
}

export async function getScriptGenerationResultSD(task: Task): Promise<void> {
  logCurrentStep(task, "Checking script generation status");
  let resp: ScriptResponse;
  const startTime = Date.now();
  while (true) {
    const taskResponse = await fetchWithRetry(
      `${getEnvVars().LUNABACKEND}/api/SoraAPI/CheckWorkflowStatus`,
      {
        method: "POST",
        body: JSON.stringify({ id: task.data.lunaTaskId }),
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
    if (Date.now() - startTime > 30 * 60 * 1000) {
      throw new Error("Script generation timed out");
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  try {
    const finalMegePos: number = 4;
    const characterPos: number = 5;
    const sound_effect: number = 6;
    const musicPos: number = 6;
    const voicePos: number = 7;

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
    const characterMapOrigin = JSON.parse(
      resp.data.workflowData.timeline[characterPos].steps[
        resp.data.workflowData.timeline[characterPos].steps.length - 1
      ].value
    );
    // 判断是数组还是对象
    let characterMap;
    if (Array.isArray(characterMapOrigin)) {
      characterMap = characterMapOrigin[0];
    } else {
      characterMap = characterMapOrigin;
    }

    // get the background music
    const backgroundMusic = JSON.parse(
      resp.data.workflowData.timeline[musicPos].steps[0].value
    ).name;

    // // get the sound effects
    // const soundEffects = JSON.parse(
    //   resp.data.workflowData.timeline[sound_effect].steps[1].value
    // );

    const inputdata = {
      videoInput: {
        shots: shots,
      },
      characterMap: characterMap,
      enableSvd: true,
      voiceMap: voiceMap,
      options: {
        background_music: backgroundMusic,
        svd: {
          fps: 12,
          motionBucketId: 30,
          high_motionBucketId: 90,
        },
      },
      // soundEffects: soundEffects,
      sdOption: task.data.options.sdOption,
    };
    // use z to parse the response
    const input = JSON.stringify(inputdata);
    const parsedResponse = VideoInputSchema.safeParse(JSON.parse(input));
    if (!parsedResponse.success) {
      throw new Error(parsedResponse.error.errors.join("\n"));
    }
    console.log("Script generation completed:", parsedResponse.data);
    const data = task.data;
    data.videoInput = parsedResponse.data;
    taskQueue.setTaskData(task.id, data);
  } catch (error: any) {
    console.error("Error in getting script generation result:", error.message);
    throw error;
  }
}

export async function generateVideoGenerationTask(task: Task): Promise<void> {
  logCurrentStep(task, "Generating video");
  const videoGenerationUrl = `${
    getEnvVars().FLOWBACKEND
  }/creator/internal/video-generation/queue`;
  const response = await fetchWithRetry(videoGenerationUrl, {
    method: "POST",
    body: JSON.stringify(task.data.videoInput),
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
  task.data.videoTaskId = parsedResponse.data.taskId;
}

export async function getVideoGenerationResult(task: Task): Promise<void> {
  logCurrentStep(task, "Checking video generation status");
  try {
    while (true) {
      const videoGenerationUrl = `${
        getEnvVars().FLOWBACKEND
      }/creator/internal/video-generation/result`;
      const response = await fetchWithRetry(videoGenerationUrl, {
        method: "POST",
        body: JSON.stringify({ taskId: task.data.videoTaskId }),
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
        await taskQueue.updateTaskResult(
          task.id,
          parsedResponse.data.result!.file
        );
        console.log("Video file:", task.result);
        return;
      }
      if (parsedResponse.data.status === "aborted") {
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
