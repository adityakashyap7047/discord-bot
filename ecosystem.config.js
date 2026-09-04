module.exports = {
  apps: [{
    name: 'discord-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    restart_delay: 3000,
    max_restarts: 50,
    min_uptime: '5s',
    kill_timeout: 5000,
    env: {
      NODE_ENV: 'production',
    },
  }],
};
