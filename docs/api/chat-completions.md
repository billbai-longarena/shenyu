# Chat Completions API

Chat Completions API提供了一个标准的接口，用于与腾讯云的语言模型进行交互。该API支持流式和非流式响应，以及多种高级功能。

## API端点

```
POST http://localhost:3002/api/v1/chat/completions
```

## 认证

API使用Bearer令牌认证：

```
Authorization: Bearer your-api-key-here
```

## 请求格式

```json
{
    "model": "deepseek-v3",
    "messages": [
        {
            "role": "system",
            "content": "系统提示"
        },
        {
            "role": "user",
            "content": "用户输入"
        }
    ],
    "temperature": 0.7,
    "stream": true,
    "stream_options": {
        "include_usage": true
    }
}
```

### 参数说明

- `model` (string, 必需): 使用的模型ID，目前支持 "deepseek-v3"
- `messages` (array, 必需): 消息数组，包含对话历史
  - `role` (string): 消息角色，可以是 "system", "user", "assistant", "tool"
  - `content` (string | array): 消息内容，可以是字符串或ContentItem数组
  - `tool_call_id` (string, 可选): tool消息必需
  - `tool_calls` (array, 可选): assistant消息可选
- `temperature` (number, 可选): 温度参数，影响随机性，范围0-2，默认0.7
- `stream` (boolean, 可选): 是否启用流式响应，默认true
- `stream_options` (object, 可选): 流式选项
  - `include_usage` (boolean): 是否包含token使用统计

### ContentItem格式

```json
{
    "type": "text",
    "text": "文本内容"
}
```

或

```json
{
    "type": "image_url",
    "image_url": {
        "url": "图片URL或base64"
    }
}
```

### ToolCall格式

```json
{
    "id": "call_xxx",
    "type": "function",
    "function": {
        "name": "函数名",
        "arguments": "JSON字符串参数"
    }
}
```

## 响应格式

### 非流式响应

```json
{
    "id": "chat_xxx",
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "助手回复",
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

### 流式响应

每个数据块格式：

```json
{
    "choices": [
        {
            "delta": {
                "content": "部分内容"
            }
        }
    ]
}
```

最后一个数据块可能包含usage信息：

```json
{
    "usage": {
        "prompt_tokens": 10,
        "completion_tokens": 20
    }
}
```

## 错误响应

```json
{
    "error": {
        "message": "错误描述",
        "type": "错误类型",
        "code": "错误代码"
    }
}
```

## 使用示例

### 基本对话请求

```javascript
const response = await fetch('http://localhost:3002/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key-here'
    },
    body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [
            {
                role: 'user',
                content: '你好，请介绍一下自己。'
            }
        ],
        stream: false
    })
});

const result = await response.json();
console.log(result.choices[0].message.content);
```

### 流式响应处理

```javascript
const response = await fetch('http://localhost:3002/api/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key-here'
    },
    body: JSON.stringify({
        model: 'deepseek-v3',
        messages: [
            {
                role: 'user',
                content: '你好，请介绍一下自己。'
            }
        ],
        stream: true,
        stream_options: {
            include_usage: true
        }
    })
});

// 处理SSE响应
const reader = response.body;
const decoder = new TextDecoder();

reader.on('data', chunk => {
    const lines = decoder.decode(chunk).split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
                console.log('流式响应结束');
                return;
            }
            try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                    process.stdout.write(parsed.choices[0].delta.content);
                }
                if (parsed.usage) {
                    console.log('Token使用统计:', parsed.usage);
                }
            } catch (e) {
                // 忽略解析错误
            }
        }
    }
});
