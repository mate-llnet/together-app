module.exports = {
  apps: [{
    name: 'appreciatemate',
    script: 'dist/index.js',
    cwd: '/opt/appreciatemate',
    env_file: '/opt/appreciatemate/.env',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    // Log files handled by default PM2 logging
  }]
};
