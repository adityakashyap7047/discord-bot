module.exports = {
  apps: [{
    name: 'discord-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 5000,
    max_restarts: 100,
    min_uptime: '10s',
    kill_timeout: 10000,
    exp_backoff_restart_delay: 100,
    env: {
      NODE_ENV: 'production',
    },
  }],
};
