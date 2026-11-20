module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        path: "app/servers/ggml/build",
        message: [
          // Companions next to the backbone (decoders, encoders, steer.gguf) are picked up automatically.
          // --gpu uses CUDA/Metal when built with it and falls back to the CPU otherwise.
          "{{platform === 'win32' ? 'zonos3-server' : './zonos3-server'}} ../../../../models/gguf/backbone-ptq.gguf --tts-default-voices-dir ../../../assets/default_voices --port {{port}} --gpu"
        ],
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
