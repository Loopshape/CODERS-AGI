module.exports = {
  apps : [{
    name   : "rootless-agi-server",
    script : "server.js",
    watch  : false,
    env    : {
      "NODE_ENV": "production",
      "MODEL_NAME": "gemma:2b"
    }
  }]
}
