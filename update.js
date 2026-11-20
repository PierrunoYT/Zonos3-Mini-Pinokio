module.exports = {
  run: [{
    method: "shell.run",
    params: {
      message: "git pull"
    }
  }, {
    method: "shell.run",
    params: {
      path: "app",
      message: [
        "git pull",
        "git submodule update --init servers/ggml/ggml third_party/zyphra-textnorm"
      ]
    }
  }, {
    // Rebuild with the cached configuration (incremental).
    method: "shell.run",
    params: {
      build: true,
      path: "app/servers/ggml",
      message: [
        "cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF {{gpu === 'nvidia' ? '-DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=native' : ''}}",
        "cmake --build build --target zonos3-server"
      ]
    }
  }, {
    // Fetches only files that changed on Hugging Face.
    method: "hf.download",
    params: {
      "_": [
        "Zyphra/ZONOS3-Mini",
        "gguf/backbone-ptq.gguf",
        "gguf/zac-keep2.gguf",
        "gguf/spk-encoder.gguf",
        "gguf/steer.gguf"
      ],
      "local-dir": "models"
    }
  }]
}
