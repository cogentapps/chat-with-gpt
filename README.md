# Chat with GPT

Chat with GPT is an open-source, unofficial ChatGPT app with extra features and more ways to customize your experience. It connects ChatGPT with ElevenLabs to give ChatGPT a realistic human voice.

Try out the hosted version at: https://www.chatwithgpt.ai

Or [self-host with Docker](#running-on-your-own-computer).

Powered by the new ChatGPT API from OpenAI, this app has been developed using TypeScript + React. We welcome pull requests from the community!

https://user-images.githubusercontent.com/127109874/223613258-0c4fef2e-1d05-43a1-ac38-e972dafc2f98.mp4

## Features

- 🚀 **Fast** response times.
- 🔎 **Search** through your past chat conversations.
- 📄 View and customize the System Prompt - the **secret prompt** the system shows the AI before your messages.
- 🌡 Adjust the **creativity and randomness** of responses by setting the Temperature setting. Higher temperature means more creativity.
- 💬 Give ChatGPT AI a **realistic human voice** by connecting your ElevenLabs text-to-speech account, or using your browser's built-in text-to-speech.
- 🎤 **Speech recognition** powered by OpenAI Whisper.
- ✉ **Share** your favorite chat sessions online using public share URLs.
- 📋 Easily **copy-and-paste** ChatGPT messages.
- ✏️ Edit your messages
- 🔁 Regenerate ChatGPT messages
- 🖼 **Full markdown support** including code, tables, and math.
- 🫰 Pay for only what you use with the ChatGPT API.

## Bring your own API keys

### OpenAI

To get started with Chat with GPT, you will need to add your OpenAI API key on the settings screen. Click "Connect your OpenAI account to get started" on the home page to begin. Once you have added your API key, you can start chatting with ChatGPT.

Your API key is stored only on your device and is never transmitted to anyone except OpenAI. Please note that OpenAI API key usage is billed at a pay-as-you-go rate, separate from your ChatGPT subscription.

### ElevenLabs

To use the realistic AI text-to-speech feature, you will need to add your ElevenLabs API key by clicking "Play" next to any message.

Your API key is stored only on your device and never transmitted to anyone except ElevenLabs.

## Running on your own computer

To run on your own device, you can use Docker:

```
docker run -v $(pwd)/data:/app/data -p 3000:3000 ghcr.io/cogentapps/chat-with-gpt:release
```

Then navigate to http://localhost:3000 to view the app.

### Store your API keys on the server

For convenience, you can store your API keys on your computer instead of entering them in the browser.

*Warning:* Be very careful doing this if anyone else has access to your self-hosted version of the app. They will be able to use the app through your API key as well.

Create a file called `config.yaml` in your `data` folder with the following contents:

```
services:
  openai:
    apiKey: (your api key)
  elevenlabs:
    apiKey: (your api key)
```

and restart the server. Login is required.

## Updating

```
docker pull ghcr.io/cogentapps/chat-with-gpt:release
```

## License

Chat with GPT is licensed under the MIT license. See the LICENSE file for more information.
