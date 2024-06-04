import { z } from "zod";

// prompt/:id response schema
export const promptResponseSchema = z.object({
  prompt: z.object({
    thumbnailURL: z.string(),
  }),
});

// script schema
export const submitScriptTaskSchema = z.object({
  PlotPrompt: z.string(),
  workflowID: z.string(),
  name: z.string(),
});
export const submitScriptTaskResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    workflowID: z.string(),
  }),
});

// video schema

export const submitVideoTaskResponseSchema = z.object({
  taskId: z.string(),
});

export const checkStatusResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  result: z.object({
    err: z.string().optional(),
    file: z.string().optional(),
    character: z.array(z.string()).optional(),
  }),
  queuedAt: z.any().optional(),
});
