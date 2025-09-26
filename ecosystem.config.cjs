module.exports = {
  apps: [{
    name: 'together',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    cwd: '/opt/together',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: '/var/log/together/error.log',
    out_file: '/var/log/together/access.log',
    log_file: '/var/log/together/combined.log'
  }]
};