# Chat with GPT

This project is forked from [Chat with GPT](https://github.com/cogentapps/chat-with-gpt) and has the following modifications:

Invoke Edge's TTS to play ChatGPT's response when ElevenLabs Text-to-Speech API Key is empty.

## Running on your own computer

To package a Docker image, use the following command:

```bash
docker-compose -f "docker-compose.yml" build
```

> You can modify the image name in the `docker-compose.yml` file under the `services.app.image` field.

To run the container, use the following command:

```bash
docker run -v ./data1:/app/data -p 3000:3000 chat-with-gpt-fork:v2.0.1
```

The `-v` command maps a directory inside the container to a location on the host system.

To use a proxy, you can add `-e` to the startup parameters. For example:

```
docker run -v ./data1:/app/data -p 3000:3000 -e http_proxy=http://host.docker.internal:10809 chat-with-gpt-fork:v2.0.1
```

Here, `http://host.docker.internal:10809` allows the container to access OpenAI through a proxy running on port 10809 of the host machine.

Then navigate to http://localhost:3000 to view the app.

## License

Chat with GPT is licensed under the MIT license. See the `LICENSE` file for more information.