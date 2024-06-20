import fetch from "node-fetch";
import { Response } from "node-fetch";
import * as dotenv from "dotenv";
import { envVarsSchema } from "./types";
import Redis from "ioredis";
import { Task } from "./taskQueue";
import { writeFile } from "fs/promises";

export const personaArr = [
  {
    bot: "https://flowgpt.com/p/yae-miko-en",
    characterList: [
      {
        name: "Yae Miko",
        lora: "",
        triggerWord: "yae miko, pink hair",
      },
    ],
    sdOption: {
      model: 303526,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "",
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/frieren-21",
    characterList: [
      {
        name: "Frieren",
        lora: "<lora:373180:0.75>",
        triggerWord: "1girl,nereirfpnxl,White hair, elf ears",
      },
    ],
    sdOption: {
      model: 303526,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "<lora:331598:0.75>",
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/luffy-14",
    characterList: [
      {
        name: "Luffy",
        lora: "",
        triggerWord: "Luffy,straw hat,",
      },
    ],
    sdOption: {
      model: 303526,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "",
      negative_prompt:
        "(low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/goku-49",
    characterList: [
      {
        name: "Goku",
        lora: "",
        triggerWord: "GOKU",
      },
    ],
    sdOption: {
      model: 303526,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "",
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
];

export async function fetchWithRetry(
  url: string,
  options = {},
  retryTimes = 5
): Promise<Response> {
  let retries = 0;
  while (retries < retryTimes) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} - ${await response.text()}`
        );
      }
      return response;
    } catch (e) {
      console.error(`Failed to fetch ${url}, retrying...`);
      console.error(e);
      retries++;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Failed to fetch ${url} after ${retryTimes} retries`);
}
export function getEnvVars() {
  dotenv.config();
  const envVars = process.env;
  const parsedEnvVars = envVarsSchema.safeParse(envVars);
  if (!parsedEnvVars.success) {
    throw new Error(parsedEnvVars.error.errors.join("\n"));
  }
  return parsedEnvVars.data;
}
export function logCurrentStep(task: Task, step: string, details?: any) {
  const userId = task.userId;
  const prompt = task.data.prompt;
  const boturl = task.data.boturl;
  // print a table with the task details
  console.table({ userId, prompt, boturl, step, details });
}

export async function downloadMedia(url: string, filePath: string) {
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const buffer = await response.buffer();
  await writeFile(filePath, buffer);
}

const { REDIS_CLOUD_URL } = getEnvVars();
export const redisClient = new Redis(REDIS_CLOUD_URL);

export function generateVideo(finalData: any) {
  let params: any = {};
  for (let i = 0; i < finalData.workflowData.timeline.length; i++) {
    for (let j = 0; j < finalData.workflowData.timeline[i].steps.length; j++) {
      // MJ视频流
      if (!finalData.createType || finalData.createType !== "sd") {
        if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-6699e9cb-a927-481c-bdd3-e2f58343d174"
        ) {
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a: any = {};
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0];
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj;
          }
          for (let q = 0; q < a.shots.length; q++) {
            a.shots[q].shot_number = parseInt(a.shots[q].shot_number);
            if (!a.shots[q].image.image_prompt.includes(" --v 6")) {
              a.shots[q].image.image_prompt += " --v 6";
            }
            a.shots[q].image.image_prompt += " --sw " + 80;
          }
          params.videoInput = a;
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-7b109e1c-2f7a-4d78-9d35-e45408749e89"
        ) {
          let obj = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
          for (let k in obj) {
            // console.log(k)
            // console.log(obj[k])
            if (!obj[k].prompt.includes(" --v 6")) {
              obj[k].prompt += " --v 6";
            }
          }
          obj[finalData.mainCharacterName].url = finalData.mainCharacterUrl;
          // console.log(obj)
          params.characterMap = obj;
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-10fa6c04-bbef-4172-b851-cfda07095dab"
        ) {
          params.options = {
            background_music: JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            ).name,
            svd: {
              fps: 12,
              motionBucketId: 90,
              high_motionBucketId: 90,
            },
            minimax: {
              vol: 1,
              speed: 1,
            },
          };
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-49770322-3526-4245-a87a-a68148e93a6b"
        ) {
          params.voiceMap = {};
          let temp = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
          for (let i = 0; i < temp.length; i++) {
            params.voiceMap[temp[i].characterName] = temp[i].id;
          }
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-1c8167f7-82bc-4d6a-a845-78fdf8047827"
        ) {
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a = [];
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0].shots;
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj.shots;
          }
          console.log(a);
          let arr = [];
          for (let i = 0; i < a.length; i++) {
            if (a[i].sound_effect !== "") {
              arr.push(a[i]);
            }
          }
          params.soundEffects = arr;
        }
      }

      //SD视频流
      if (finalData.createType === "sd") {
        if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-6699e9cb-a927-481c-bdd3-e2f58343d174"
        ) {
          // params.videoInput = JSON.parse(finalData.workflowData.timeline[i].steps[j].value)
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a: any = {};
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0];
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj;
          }
          for (let q = 0; q < a.shots.length; q++) {
            a.shots[q].shot_number = parseInt(a.shots[q].shot_number);
            for (let t = 0; t < finalData.characterList.length; t++) {
              if (a.shots[q].image.actor === finalData.characterList[t].name) {
                a.shots[q].image.image_prompt +=
                  "," +
                  finalData.characterList[t].triggerWord +
                  "," +
                  finalData.characterList[t].lora;
              }
            }
          }
          params.videoInput = a;
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-0b964f34-4c02-4a08-99aa-56b5f942f94d"
        ) {
          params.characterMap = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-10fa6c04-bbef-4172-b851-cfda07095dab"
        ) {
          params.options = {
            background_music: JSON.parse(
              finalData.workflowData.timeline[i].steps[j].value
            ).name,
            svd: {
              fps: 12,
              motionBucketId: 90,
              high_motionBucketId: 90,
            },
            minimax: {
              vol: 1,
              speed: 1,
            },
          };
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-49770322-3526-4245-a87a-a68148e93a6b"
        ) {
          console.log("444");
          params.voiceMap = {};
          console.log(finalData.workflowData.timeline[i].steps[j].value);
          let temp = JSON.parse(
            finalData.workflowData.timeline[i].steps[j].value
          );
          for (let i = 0; i < temp.length; i++) {
            params.voiceMap[temp[i].characterName] = temp[i].id;
          }
        } else if (
          finalData.workflowData.timeline[i].steps[j].id ===
          "LunaGarden-1c8167f7-82bc-4d6a-a845-78fdf8047827"
        ) {
          let temp = JSON.parse(JSON.stringify(finalData));
          let obj = JSON.parse(temp.workflowData.timeline[i].steps[j].value);
          let a = [];
          if (Object.prototype.toString.call(obj) === "[object Array]") {
            a = obj[0].shots;
          } else if (
            Object.prototype.toString.call(obj) === "[object Object]"
          ) {
            a = obj.shots;
          }
          console.log(a);
          let arr = [];
          for (let i = 0; i < a.length; i++) {
            if (a[i].sound_effect !== "") {
              arr.push(a[i]);
            }
          }
          params.soundEffects = arr;
        }
      }
    }
  }
  if (finalData.createType === "sd") {
    params.sdOption = finalData.sdOption;
    for (let q = 0; q < params.videoInput.shots.length; q++) {
      if (params.characterMap[params.videoInput.shots[q].image.actor]) {
        //检查params.videoInput.shots[q].image.image_prompt中有没有<lora
        if (!params.videoInput.shots[q].image.image_prompt.includes("<lora")) {
          params.videoInput.shots[q].image.image_prompt +=
            "," +
            params.characterMap[params.videoInput.shots[q].image.actor].prompt;
        }
      }
      let testArr = params.videoInput.shots[q];
      for (let key in params.characterMap) {
        // 2. 排除obj.image.actor和key不相等值。SETTING不参与匹配。
        if (
          testArr.image.image_prompt.includes(key) &&
          key !== testArr.image.actor &&
          key !== "SETTING"
        ) {
          // 3. 如果出现和b中相同的key值，则将匹配到的替换第一个值为actorName+'('+ b[actorName].prompt +')'。
          let flag = false;
          for (let t = 0; t < finalData.characterList.length; t++) {
            if (key === finalData.characterList[t].name) {
              testArr.image.image_prompt = testArr.image.image_prompt.replace(
                key,
                key +
                  "(" +
                  finalData.characterList[t].triggerWord +
                  "," +
                  finalData.characterList[t].lora +
                  ")"
              );
              flag = true;
            }
          }
          if (!flag) {
            testArr.image.image_prompt = testArr.image.image_prompt.replace(
              key,
              key + "(" + params.characterMap[key].prompt + ")"
            );
          }
        }
      }
      if (params.sdOption.styleLora && params.sdOption.styleLora !== "") {
        console.log(params.sdOption.styleLora);
        params.videoInput.shots[q].image.image_prompt +=
          "," + params.sdOption.styleLora;
      }
    }
  }
  params.enableSvd = finalData.enableSvd;
  params.PlotPrompt = finalData.PlotPrompt;
  params.flagName = finalData.name;
  return params;
}
