# Chat Completions API

The Chat Completions API provides a standard interface for interacting with Tencent Cloud's language models. This API supports both streaming and non-streaming responses, along with various advanced features.

## API Endpoint

```
POST http://localhost:3002/api/v1/chat/completions
```

## Authentication

The API uses Bearer token authentication:

```
Authorization: Bearer sk-cline-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Request Format

```json
{
    "model": "deepseek-v3",
    "messages": [
        {
            "role": "system",
            "content": "System prompt"
        },
        {
            "role": "user",
            "content": "User input"
        }
    ],
    "temperature": 0.7,
    "stream": true,
    "stream_options": {
        "include_usage": true
    }
}
```

### Parameters

- `model` (string, required): Model ID to use, currently supports "deepseek-v3"
- `messages` (array, required): Array of messages containing conversation history
  - `role` (string): Message role, can be "system", "user", "assistant", "tool"
  - `content` (string | array): Message content, can be string or ContentItem array
  - `tool_call_id` (string, optional): Required for tool messages
  - `tool_calls` (array, optional): Optional for assistant messages
- `temperature` (number, optional): Temperature parameter affecting randomness, range 0-2, default 0.7
- `stream` (boolean, optional): Whether to enable streaming response, default true
- `stream_options` (object, optional): Streaming options
  - `include_usage` (boolean): Whether to include token usage statistics

### ContentItem Format

```json
{
    "type": "text",
    "text": "Text content"
}
```

or

```json
{
    "type": "image_url",
    "image_url": {
        "url": "Image URL or base64"
    }
}
```

### ToolCall Format

```json
{
    "id": "call_xxx",
    "type": "function",
    "function": {
        "name": "Function name",
        "arguments": "JSON string arguments"
    }
}
```

## Response Format

### Non-streaming Response

```json
{
    "id": "chat_xxx",
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "Assistant reply",
                "tool_calls": []
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20
    }
}
```

### Streaming Response

Format for each data chunk:

```json
{
    "choices": [
        {
            "delta": {
                "content": "Partial content"
            }
        }
    ]
}
```

The last data chunk may include usage information:

```json
{
    "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20
    }
}
```

## Error Response

```json
{
    "error": {
        "message": "Error description",
        "type": "Error type",
        "code": "Error code"
    }
}
```

## Usage Examples

### Basic Chat Request

```javascript
const response = await fetch('http://localhost:3002/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-cline-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [
            {
                role: 'user',
                content: 'Hello, please introduce yourself.'
            }
        ],
        stream: false
    })
});

const result = await response.json();
console.log(result.choices[0].message.content);
```

### Handling Streaming Response

```javascript
const response = await fetch('http://localhost:3002/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-cline-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    },
    body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [
            {
                role: 'user',
                content: 'Hello, please introduce yourself.'
            }
        ],
        stream: true,
        stream_options: {
            include_usage: true
        }
    })
});

// Handle SSE response
const reader = response.body;
const decoder = new TextDecoder();

reader.on('data', chunk => {
    const lines = decoder.decode(chunk).split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
                console.log('Stream response ended');
                return;
            }
            try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                    process.stdout.write(parsed.choices[0].delta.content);
                }
                if (parsed.usage) {
                    console.log('Token usage statistics:', parsed.usage);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }
});
