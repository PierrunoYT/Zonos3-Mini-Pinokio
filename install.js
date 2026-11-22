module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: {
        message: [
          "git clone https://github.com/Zyphra/ZONOS3-Mini app"
        ]
      }
    },
    // The ggml server needs only these two submodules (fusealign is for speech editing).
    // --force drops the ggml patches CMake applied to the submodule; the configure step re-applies them.
    {
      method: "shell.run",
      params: {
        path: "app",
        message: [
          "git submodule update --init --force servers/ggml/ggml third_party/zyphra-textnorm"
        ]
      }
    },
    // CMake builds the text normalizer (a Rust library) with cargo.
    {
      method: "shell.run",
      params: {
        message: [
          "conda install -y -c conda-forge rust cmake ninja"
        ]
      }
    },
    // Native C++/ggml server: CUDA on NVIDIA, Metal on Apple Silicon (ggml default), CPU otherwise.
    // build: true loads the MSVC (and CUDA) toolchain on Windows.
    {
      method: "shell.run",
      params: {
        build: true,
        path: "app/servers/ggml",
        message: [
          "cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF {{gpu === 'nvidia' ? '-DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=native' : ''}}",
          "cmake --build build --target zonos3-server"
        ]
      }
    },
    // ~1.2 GB: default backbone, decoder, speaker encoder and steering bundle.
    {
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
    }
  ]
}
