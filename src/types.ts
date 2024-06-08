import { z } from "zod";

export const commands = [
  {
    name: "generate",
    description: "Creates a video generation task.",
    options: [
      {
        type: 3, // 字符串类型
        name: "boturl",
        description: "The bot url for the video generation.",
        required: true,
      },
      {
        type: 3, // 字符串类型
        name: "maincharacter",
        description: "The main character for the video generation.",
        required: true,
      },
      {
        type: 3, // 字符串类型
        name: "story",
        description: "The prompt for the video generation.",
        required: true,
      },
    ],
  },
];

// env vars schema
export const envVarsSchema = z.object({
  TOKEN: z.string(),
  CLIENT_ID: z.string(),
  FLOWBACKEND: z.string(),
  LUNABACKEND: z.string(),
  LUNAWORKFLOWID: z.string(),
  REDIS_CLOUD_URL: z.string(),
});

const DialogueSchema = z.object({
  speaker: z.string(),
  voice_tone: z.string().optional(),
  line: z.string(),
});

const ImageSchema = z.object({
  actor: z.string(),
  image_prompt: z.string(),
});

const ShotSchema = z.object({
  shot_number: z.number(),
  image: ImageSchema,
  dialogue: DialogueSchema,
});

const VideoInputDataSchema = z.object({
  shots: z.array(ShotSchema),
});

const OptionSchema = z.object({
  background_music: z.string().optional(),
  voiceModelId: z.string().optional(),
});

export const VideoInputSchema = z.object({
  videoInput: VideoInputDataSchema,
  // char name to image prompt
  characterMap: z.record(
    z.string(),
    z.object({
      url: z.string().optional(),
      prompt: z.string().optional(),
    })
  ),
  voiceMap: z.record(z.string(), z.string()),
  options: OptionSchema.optional(),
});

export type VideoInput = z.infer<typeof VideoInputSchema>;

export type VideoInputData = z.infer<typeof VideoInputDataSchema>;
export const userInputSchema = z.object({
  prompt: z.string(),
  boturl: z.string(),
  maincharacter: z.string().optional(),
  maincharacterurl: z.string().optional(),
  lunaTaskId: z.string().optional(),
  videoTaskId: z.string().optional(),
  videoInput: VideoInputSchema.optional(),
});
