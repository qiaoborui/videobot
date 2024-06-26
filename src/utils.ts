// @ts-nocheck
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
      lora: "<lora:331598:0.75>",
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
  {
    bot: "https://flowgpt.com/p/cloud-22",
    characterList: [
      {
        name: "Cloud",
        lora: "",
        triggerWord:
          "Cloud_strife, Blonde short hair, blue eyes, strong and tall, black  vest, black long jeans, 1boy ,",
      },
    ],
    sdOption: {
      model: 254091,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "",
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/asuka-53",
    characterList: [
      {
        name: "Asuka",
        lora: "",
        triggerWord:
          "Soryu Asuka Langley/(EVA/),fiery red eyes,red hair,tights,red battle suit,",
      },
    ],
    sdOption: {
      model: 403131,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "<lora:427608:0.7>",
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/joker-32",
    characterList: [
      {
        name: "Joker",
        lora: "<lora:249724:0.8>",
        triggerWord: "Joker",
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
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/batman-16",
    characterList: [
      {
        name: "Batman",
        lora: "<lora:249675:0.8>",
        triggerWord: "Batman",
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
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/tifa-34",
    characterList: [
      {
        name: "Tifa",
        lora: "",
        triggerWord: "Tifa Lockhart,white vest,1girl,cute expression, ",
      },
    ],
    sdOption: {
      model: 254091,
      width: 1280,
      height: 720,
      lora: "",
      sampler: "Euler a",
      steps: 20,
      cfg_scale: 5,
      styleLora: "",
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/sailor-moon-6",
    characterList: [
      {
        name: "Sailor Moon",
        lora: "",
        triggerWord: "Sailor Moon,White JK,",
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
      styleLora: "<lora:331598:0.8>",
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/naomi-79",
    characterList: [
      {
        name: "Naomi",
        lora: "",
        triggerWord: "Nami,Short hair, ",
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
      styleLora: "<lora:222794:0.7>",
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
  {
    bot: "https://flowgpt.com/p/naruto-112",
    characterList: [
      {
        name: "Naruto",
        lora: "",
        triggerWord: "naruto",
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
      styleLora: "<lora:379207:0.8>",
      // positive_prompt:'analog film photo  . faded film, desaturated, 35mm photo, grainy, vignette, vintage, Kodachrome, Lomography, stained, highly detailed, found footage'
      negative_prompt:
        "(02-A2(芩潇功能:0.9524)修手04完整版较推荐-bad_prompt), (low quality, worst quality:1.4),(bad-artist:0.7),(nsfw:1.8),multiple people,multiple heads,",
    },
  },
];

export const styleMap: Record<string, string> = {
  General: "LunaGarden-4aea0b8e-e40b-4eef-bef1-1f2d0168eeaf",
  Horror: "LunaGarden-99065073-f8bc-42dd-a382-def645914179",
};

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
