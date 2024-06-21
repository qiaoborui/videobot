import { z } from "zod";
// env vars schema
export const envVarsSchema = z.object({
  TOKEN: z.string(),
  CLIENT_ID: z.string(),
  FLOWBACKEND: z.string(),
  LUNABACKEND: z.string(),
  LUNAWORKFLOWID: z.string(),
  REDIS_CLOUD_URL: z.string(),
  CHANNEL_IDS: z.string(),
  TIMES: z.number(),
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

const svdSchema = z.object({
  seed: z.number().optional(),
  decodeChunkSize: z.number().optional(),
  fps: z.number().optional(),
  high_motionBucketId: z.number().optional(),
  motionBucketId: z.number().optional(),
  noiseAugStrength: z.number().optional(),
});

const minimaxOptionSchema = z.object({
  vol: z.number().optional(),
  speed: z.number().optional(),
});

const OptionSchema = z.object({
  background_music: z.string().optional(),
  voiceModelId: z.string().optional(),
  svd: svdSchema.optional(),
  minimax: minimaxOptionSchema.optional(),
});

const soundEffectSchema = z.object({
  shot_number: z.number(),
  sound_effect_description: z.string(),
});

export const VideoInputSchema = z.object({
  PlotPrompt: z.string().optional(),
  flagName: z.string().optional(),
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
  soundEffects: z.array(soundEffectSchema).optional(),
  options: OptionSchema.optional(),
  enableSvd: z.boolean().optional().default(true),
  sdOption: z
    .object({
      model: z.number(),
      negative_prompt: z.string().optional(),
      sampler: z.string().optional(),
      steps: z.number().optional(),
      cfg_scale: z.number().optional(),
      lora: z.string().optional().default(""),
      width: z.number().optional(),
      height: z.number().optional(),
      triggerWord: z.string().optional(),
    })
    .optional(),
});

export type VideoInput = z.infer<typeof VideoInputSchema>;

export type VideoInputData = z.infer<typeof VideoInputDataSchema>;

export const userInputSchema = z.object({
  prompt: z.string(),
  boturl: z.string(),
  options: z.any().optional(),
  maincharacter: z.string().optional(),
  maincharacterurl: z.string().optional(),
  lunaTaskId: z.string().optional(),
  videoTaskId: z.string().optional(),
  videoInput: VideoInputSchema.optional(),
});
