module.exports = {
  apps: [
    {
      name: 'textile-waste-hub-backend',
      script: './server/server.js',
      instances: 'max', // Utilizes all CPU cores in cluster mode
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      error_file: './server/logs/pm2-err.log',
      out_file: './server/logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
