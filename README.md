# Chat with GPT

Chat with GPT is an open-source, unofficial ChatGPT app with extra features and more ways to customize your experience. It connects ChatGPT with ElevenLabs to give ChatGPT a realistic human voice.

Try out the hosted version at: https://chatwithgpt.netlify.app

Powered by the new ChatGPT API from OpenAI, this app has been developed using TypeScript + React. We welcome pull requests from the community!

https://user-images.githubusercontent.com/127109874/223613258-0c4fef2e-1d05-43a1-ac38-e972dafc2f98.mp4

<a href="https://www.buymeacoffee.com/cogentdev" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 145px !important;" ></a>

## Features

- 🚀 **Fast** response times.
- 🔎 **Search** through your past chat conversations.
- 📄 View and customize the System Prompt - the **secret prompt** the system shows the AI before your messages.
- 🌡 Adjust the **creativity and randomness** of responses by setting the Temperature setting. Higher temperature means more creativity.
- 💬 Give ChatGPT AI a **realistic human voice** by connecting your ElevenLabs text-to-speech account.
- ✉ **Share** your favorite chat sessions online using public share URLs.
- 📋 Easily **copy-and-paste** ChatGPT messages.
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

1. First, you'll need to have Git installed on your computer. If you don't have it installed already, you can download it from the official Git website: https://git-scm.com/downloads.

2. Once Git is installed, you can clone the Chat with GPT repository by running the following command in your terminal or command prompt:

```
git clone https://github.com/cogentapps/chat-with-gpt.git
```

3. Next, you'll need to have Node.js and npm (Node Package Manager) installed on your computer. You can download the latest version of Node.js from the official Node.js website: https://nodejs.org/en/download/

4. Once Node.js is installed, navigate to the root directory of the Chat with GPT repository in your terminal or command prompt and run the following command to install the required dependencies:

```
npm install
```

This will install all the required dependencies specified in the package.json file.

5. Finally, run the following command to start the development server:

```
npm run start
```

This will start the development server on port 3000. You can then open your web browser and navigate to http://localhost:3000 to view the Chat with GPT webapp running locally on your computer.

## Roadmap

- Edit messages (coming soon)
- Regenerate messages (coming soon)

## License

Chat with GPT is licensed under the MIT license. See the LICENSE file for more information.
