import { z } from 'zod';
import { MAX_UPLOAD_SIZE, SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES } from '../constants/upload';

export const selectedFileSchema = z
  .object({
    name: z.string().min(1, { message: 'File name is required' }),
    size: z.number().min(1, { message: 'File cannot be empty' }),
    type: z.string().min(1, { message: 'File type is required' }),
    lastModified: z.number(),
  })
  .refine(
    (file) => {
      // Validate MIME type
      return SUPPORTED_MIME_TYPES.includes(file.type as any);
    },
    {
      message: `Invalid MIME type. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
      path: ['type'],
    },
  )
  .refine(
    (file) => {
      // Validate File size
      return file.size <= MAX_UPLOAD_SIZE;
    },
    {
      message: `File size exceeds the limit of ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`,
      path: ['size'],
    },
  )
  .refine(
    (file) => {
      // Validate Extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && SUPPORTED_EXTENSIONS.includes(ext as any);
    },
    {
      message: `Unsupported file extension. Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      path: ['name'],
    },
  );

export const uploadValidationSchema = z.object({
  selectedFile: selectedFileSchema,
});

export type InferredSelectedFile = z.infer<typeof selectedFileSchema>;
export type InferredUploadValidation = z.infer<typeof uploadValidationSchema>;
