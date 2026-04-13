module.exports = {
  apps: [
    {
      name: 'property-api',
      script: './apps/api/dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/api-error.log',
      out_file:   './logs/api-out.log',
      time: true,
    },
  ],
};
