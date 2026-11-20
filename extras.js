// Optional models (~7.8 GB). The server loads them automatically on the next Start.
// zac-encoder + ssl-teacher: raw-reference voice cloning from uploaded clips.
// zac.gguf: the full-size decoder, selectable per request next to the default one.
module.exports = {
  run: [{
    method: "hf.download",
    params: {
      "_": [
        "Zyphra/ZONOS3-Mini",
        "gguf/zac-encoder.gguf",
        "gguf/ssl-teacher.gguf",
        "gguf/zac.gguf"
      ],
      "local-dir": "models"
    }
  }]
}
