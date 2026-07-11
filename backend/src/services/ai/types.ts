import { AiResponseSchemaType } from '../../schemas/ai.schema.js';

export interface AIExtractionResponse {
  readonly data: AiResponseSchemaType;
  readonly usage?: {
    readonly prompt_tokens: number;
    readonly completion_tokens: number;
    readonly total_tokens: number;
  };
}
