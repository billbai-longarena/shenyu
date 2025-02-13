# Best Practices for Adding New Models [English]

This document outlines the best practices for integrating new large language models into the Shenyu project.

## Overview

1. API Verification
2. Type Definitions
3. Model Configuration
4. Frontend Integration
5. Testing and Validation

## Detailed Steps

### 1. API Verification

Before starting the integration, verify the API availability:

```bash
# Test API using curl
curl -X POST "API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "model-name",
    "messages": [
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
```

Verify the following:
- API endpoint accessibility
- Authentication method correctness
- Response format compliance

### 2. Type Definitions

1. Add model type in frontend (`packages/frontend/src/api/api-deepseekStream.ts`):
```typescript
export type ModelType = 'existing-models' | 'new-model-name';
```

2. Add model type in backend (`packages/backend/src/types/api.ts`):
```typescript
export type ModelType = 'existing-models' | 'new-model-name';
```

### 3. Model Configuration

Add new model configuration in backend (`packages/backend/src/services/model-service.ts`):

```typescript
'new-model-name': {
    apiKey: process.env.NEW_MODEL_API_KEY || '',
    url: 'https://api.example.com/v1/chat/completions',
    model: 'model-name',
    maxTokens: 8096,
    temperatureRange: {
        min: 0,
        max: 2.0
    }
}
```

Key configuration parameters:
- `apiKey`: API key from environment variables
- `url`: API endpoint
- `model`: Model identifier
- `maxTokens`: Maximum token count
- `temperatureRange`: Temperature range configuration
  - `min`: Minimum temperature value
  - `max`: Maximum temperature value (varies by model, e.g., kimi: 1.0, deepseek: 2.0)

### 4. Frontend Integration

Add model option in App.vue:

```typescript
const modelOptions = ref<ModelOption[]>([
  // Existing models...
  { 
    label: 'New Model Display Name', 
    value: 'new-model-name', 
    speed: { status: 'none' } 
  }
]);
```

Frontend provides three fixed temperature options:
```typescript
const temperatureOptions = computed(() => {
  return [
    { label: t('modelParams.conservative'), value: 0.1 },
    { label: t('modelParams.balanced'), value: 0.5 },
    { label: t('modelParams.creative'), value: 0.9 }
  ]
})
```

### 5. Testing and Validation

1. Environment Variable Configuration:
```bash
# Add API key in .env file
NEW_MODEL_API_KEY="your-api-key"
```

2. Functionality Testing:
- Model selection
- Conversation functionality
- Temperature adjustment
- Speed testing

## Important Considerations

1. API Authentication Handling
- Set correct authentication format according to API requirements
- Add special handling in getHeaders method (if needed)

2. Error Handling
- Add appropriate error handling logic
- Ensure user-friendly error messages

3. Environment Variables
- Use consistent naming conventions
- Document required environment variables

4. Code Style
- Maintain consistency with existing code
- Add necessary comments

## Example

Here's an example of adding the Volces DeepseekV3 model:

1. API Verification:
```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "ep-model-id",
    "messages": [
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
```

2. Type Definition:
```typescript
export type ModelType = 'existing-models' | 'volcesDeepseek';
```

3. Model Configuration:
```typescript
'volcesDeepseek': {
    apiKey: process.env.VOLCES_API_KEY || '',
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'ep-model-id',
    maxTokens: 8096,
    temperatureRange: {
        min: 0,
        max: 1.0
    }
}
```

4. Frontend Integration:
```typescript
const modelOptions = ref<ModelOption[]>([
  // Other models...
  { 
    label: 'Volces DeepseekV3', 
    value: 'volcesDeepseek', 
    speed: { status: 'none' } 
  }
]);
```

## Common Issues

1. API Authentication Failures
- Check API key format
- Verify environment variables are loaded correctly
- Confirm authentication header format

2. Response Parsing Errors
- Check API response format
- Ensure correct stream response handling

3. Temperature Setting Issues
- Frontend provides three fixed options (0.1/0.5/0.9)
- Backend automatically handles temperature range limits based on model configuration
- Different models may have different maximum temperatures (1.0 or 2.0), handled automatically by backend

4. Performance Issues
- Monitor response times
- Check concurrent processing
- Optimize token limits

## References

- [API Documentation](docs/api/chat-completions.md)
- [State Management Best Practices](docs/guide/state-management-best-practices.md)
- [Development Guide](docs/guide/index.md)
