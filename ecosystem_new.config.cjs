/**
 * PM2 Ecosystem Configuration for Renuga CRM
 * 
 * This file defines how the Renuga CRM API server is managed by PM2.
 * 
 * Usage:
 *   pm2 start ecosystem_new.config.cjs           # Start the app
 *   pm2 restart ecosystem_new.config.cjs         # Restart the app
 *   pm2 stop ecosystem_new.config.cjs            # Stop the app
 *   pm2 delete ecosystem_new.config.cjs          # Remove from PM2
 *   pm2 logs renuga-crm-api                  # View logs
 *   pm2 save                                 # Save PM2 state for auto-restart
 *   pm2 startup                              # Configure auto-start on reboot
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'renuga-crm-api',

      // Script to run (using npm start)
      script: 'npm',
      args: 'start',

      // Working directory
      cwd: '/var/www/renuga-crm/server',

      // Number of instances to spawn
      // Set to 'max' to use all CPU cores
      // Set to 1 for single instance (recommended for most cases)
      instances: 1,

      // Execution mode
      exec_mode: 'fork',  // 'fork' for single process, 'cluster' for multi-process

      // Auto restart crashed app
      autorestart: true,

      // Don't restart the app in watch mode
      watch: false,

      // Watch specific directories (optional)
      // watch: ['src'],
      // ignore_watch: ['node_modules', 'logs'],

      // Max memory allowed
      max_memory_restart: '1G',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },

      // Environment variables for development (optional)
      env_development: {
        NODE_ENV: 'development'
      },

      // Graceful shutdown
      kill_timeout: 5000,        // Wait 5 seconds before killing
      listen_timeout: 10000,     // Wait 10 seconds for app to listen

      // Logging
      error_file: '/var/log/pm2/renuga-crm-api-error.log',
      out_file: '/var/log/pm2/renuga-crm-api-out.log',
      log_file: '/var/log/pm2/renuga-crm-api-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs from multiple instances
      merge_logs: true,

      // Min uptime before restart counter resets
      min_uptime: '10s',

      // Max restarts in 1 minute before giving up
      max_restarts: 10,

      // Restart delay in milliseconds
      restart_delay: 4000,

      // Command to run on restart
      // post_update: 'npm install && npm run build'
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-ec2-instance.com',
      ref: 'origin/main',
      repo: 'git@github.com:Tillo-Tenney/Renuga-CRM-EC2.git',
      path: '/var/www/renuga-crm',
      'post-deploy': 'npm install && npm run build && pm2 restart ecosystem_new.config.cjs'
    }
  }
};
