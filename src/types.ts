import { z } from "zod";

// command schema
export const generateCommandSchema = z.object({
  prompt: z.string(),
  boturl: z.string(),
});

export const checkStatusCommandSchema = z.object({
  task_id: z.string(),
});
export const commands = [
  {
    name: "generate",
    description: "Creates a video generation task.",
    options: [
      {
        type: 3, // 字符串类型
        name: "prompt",
        description: "The prompt for the video generation.",
        required: true,
      },
      {
        type: 3, // 字符串类型
        name: "boturl",
        description: "The bot url for the video generation.",
        required: true,
      },
    ],
  },
  {
    name: "check_status",
    description: "Checks the status of a specific task.",
    options: [
      {
        type: 3, // 字符串类型
        name: "task_id",
        description: "The ID of the task to check.",
        required: true,
      },
    ],
  },
  {
    name: "list_tasks",
    description: "Lists all active video generation tasks.",
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
  // char name to 11labs voiceid
  voiceMap: z.record(z.string(), z.string()),
  voiceModelId: z.string().optional(),
});

export type VideoInput = z.infer<typeof VideoInputSchema>;

export type VideoInputData = z.infer<typeof VideoInputDataSchema>;
