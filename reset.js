// Deletes the cloned repo and its build. Model weights in models/ are kept.
module.exports = {
  run: [{
    method: "fs.rm",
    params: {
      path: "app"
    }
  }]
}
