# ZONOS3-Mini - Pinokio Launcher

A 1-click [Pinokio](https://pinokio.co) launcher for [ZONOS3-Mini](https://huggingface.co/Zyphra/ZONOS3-Mini), Zyphra's compact open-source text-to-speech model (800M parameters, about 100M active per token, Apache-2.0 weights).

## What it does

- Speaks text in 43 languages at 44.1 kHz.
- Clones a voice from an uploaded or recorded clip, or uses one of the 27 default voices.
- Designs voices and steers emotion, pace, accent and delivery, down to individual words.
- Builds and runs Zyphra's native C++/ggml server (`zonos3-server`) from the [ZONOS3-Mini repo](https://github.com/Zyphra/ZONOS3-Mini). It serves **Zonos Voice Studio** (`/studio`), the lightweight voice-cloning page (`/lite`) and an HTTP API.

The backend is picked from your hardware when the server is built:

| Machine | Backend |
|---|---|
| NVIDIA GPU (Windows, Linux) | CUDA |
| Apple Silicon Mac | Metal |
| Anything else | CPU (the model is small enough to run in real time on a laptop CPU) |

## Requirements

- About 3 GB of disk space: 1.2 GB of models, plus the source and build. The optional extra models add 7.8 GB.
- Install compiles the server, which takes a few minutes. Pinokio provides the compilers (Visual Studio Build Tools on Windows, CUDA on NVIDIA). Installing also adds Rust, CMake and Ninja to Pinokio's conda environment. On Linux you need a C/C++ compiler (`gcc`/`g++`); on macOS you need the Xcode Command Line Tools.

## How to use

1. Click **Install**. It clones the repo into `app`, builds `zonos3-server` in `app/servers/ggml/build`, and downloads the default models into `models/gguf`.
2. Click **Start**. Once the server is listening, **Open Web UI** opens the start page. From there, pick **Zonos Voice Studio** or **Lite**.
3. Pick a voice (or upload or record one), type text and generate.

**Download Extra Models** (optional, about 7.8 GB) fetches `zac-encoder.gguf` and `ssl-teacher.gguf` for raw-reference voice cloning (the voice is encoded as codec codes instead of a speaker embedding), plus `zac.gguf`, the full-size decoder (`full_mr`). Without them, uploaded voices are cloned through the speaker embedding. Restart the app after the download; the server loads the files automatically.

**Update** pulls the latest launcher and ZONOS3-Mini source, rebuilds the server, and re-downloads any model files that changed. **Reset** deletes `app`. The models in `models/` are kept, so the next Install does not download them again.

Speech editing and plugins need the repo's Python workers and are not set up by this launcher.

## API

The server listens on `127.0.0.1` at a port that Pinokio chooses. Copy the address from **Open Web UI**; the examples use `http://127.0.0.1:42000`. The full reference is [docs/api.md](https://github.com/Zyphra/ZONOS3-Mini/blob/main/docs/api.md), and the schema is [servers/api/openapi.yaml](https://github.com/Zyphra/ZONOS3-Mini/blob/main/servers/api/openapi.yaml).

| Method | Path | Description |
|---|---|---|
| `GET` | `/v2/health` | `{"status": "ok"}` |
| `GET` | `/v2/capabilities` | Features of the loaded model and server (languages, decoders, speaker modes) |
| `GET` | `/v2/speakers` | Default voices and the voices cached in your session |
| `POST` | `/v2/speakers` | Cache a voice from a clip (`speaker_audio_base64`); needs an `X-TTS-Session-ID` header |
| `POST` | `/v2/generate` | Native text to speech, streamed or buffered |
| `POST` | `/v1/audio/speech` | OpenAI-compatible text to speech |
| `GET` | `/v2/controls` | Steering controls (emotion, voice design, accents) |

Main `/v2/generate` fields:

| Field | Default | Notes |
|---|---|---|
| `text` | required | Text to speak |
| `language` | `en_us` | Language code, for example `en_gb`, `fr_fr`, `de`, `es`, `ja`, `cmn` (`/v2/capabilities` lists them) |
| `speaker_embedding_id` | `null` | A voice id from `GET /v2/speakers` |
| `speaker_audio_base64` | `null` | Clone directly from a base64-encoded clip (up to 60 s) |
| `speaker_mode` | model default | `embedding` or `reference` (`reference` needs the extra models for uploaded clips) |
| `stream` | `true` | `true` returns float32 PCM, 44.1 kHz mono, as it is generated |
| `format` | `pcm` | `wav` returns a 16-bit WAV file; needs `stream: false` |
| `seed` | `null` | Fixed seed for repeatable output; the seed used is returned in `X-Seed` |
| `controls` | `null` | Steering doses, for example `{"delivery.tempo": 2}` (ids from `/v2/controls`) |

`POST /v1/audio/speech` takes `model` (any value), `input`, `voice` (a speaker id) and `response_format` (`pcm` or `wav`).

### curl

```sh
# First default voice
curl -s http://127.0.0.1:42000/v2/speakers

# Text to speech as a WAV file
curl -s http://127.0.0.1:42000/v2/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from ZONOS3-Mini.", "speaker_embedding_id": "<voice id>", "stream": false, "format": "wav"}' \
  -o hello.wav

# OpenAI-compatible
curl -s http://127.0.0.1:42000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model": "zonos3", "input": "Hello world.", "voice": "<voice id>", "response_format": "wav"}' \
  -o speech.wav
```

### Python

```python
import base64
import requests

BASE = "http://127.0.0.1:42000"

voice = requests.get(f"{BASE}/v2/speakers").json()["speakers"][0]["id"]

r = requests.post(f"{BASE}/v2/generate", json={
    "text": "Hello from ZONOS3-Mini.",
    "speaker_embedding_id": voice,
    "stream": False,
    "format": "wav",
})
r.raise_for_status()
open("hello.wav", "wb").write(r.content)

# Clone a voice from your own clip
clip = base64.b64encode(open("my_voice.wav", "rb").read()).decode()
r = requests.post(f"{BASE}/v2/generate", json={
    "text": "This is spoken in the cloned voice.",
    "speaker_audio_base64": clip,
    "speaker_mode": "embedding",
    "stream": False,
    "format": "wav",
})
r.raise_for_status()
open("cloned.wav", "wb").write(r.content)
```

### JavaScript

```javascript
import { writeFile } from "node:fs/promises";

const BASE = "http://127.0.0.1:42000";

const { speakers } = await (await fetch(`${BASE}/v2/speakers`)).json();

const res = await fetch(`${BASE}/v2/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Hello from ZONOS3-Mini.",
    speaker_embedding_id: speakers[0].id,
    stream: false,
    format: "wav",
  }),
});
if (!res.ok) throw new Error(await res.text());
await writeFile("hello.wav", Buffer.from(await res.arrayBuffer()));
```

## License

ZONOS3-Mini weights: Apache-2.0. ZONOS3-Mini code: MIT. See the [model card](https://huggingface.co/Zyphra/ZONOS3-Mini) and the [repo](https://github.com/Zyphra/ZONOS3-Mini). This launcher is MIT licensed (see [LICENSE](LICENSE)).
