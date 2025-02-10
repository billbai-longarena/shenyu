import { ModelType } from '../../types/api.js';
import { APIErrorDetails } from '../types/ai.js';

export async function handleApiError(
    status: number,
    statusText: string,
    errorText: string,
    model: ModelType,
    prompt: string
): Promise<string> {
    const details: APIErrorDetails = {
        status,
        statusText,
        errorBody: errorText,
        model,
        promptLength: prompt.length,
        tokensEstimate: Math.ceil(prompt.length / 4)
    };

    console.error('API Error Details:', details);

    let errorMessage = `API request failed (${status}): ${statusText}`;
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
            errorMessage += ` - ${errorJson.error.type || ''}: ${errorJson.error.message || ''}`;
        }
    } catch (e) {
        errorMessage += ` - ${errorText}`;
    }
    return errorMessage;
}
