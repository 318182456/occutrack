const { spawn } = require('child_process');

console.log('🚀 Starting OccuTrack Development Environment...');

// Start Vite dev server on port 3000
const vite = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], { 
  stdio: 'inherit', 
  shell: true,
  env: { ...process.env, FORCE_COLOR: 'true' }
});

// Start Express backend server on port 3001
const server = spawn('npx', ['tsx', 'watch', 'server.ts'], { 
  stdio: 'inherit', 
  shell: true,
  env: { ...process.env, FORCE_COLOR: 'true' }
});

// Ensure children are killed when parent exits
const killChildren = () => {
  console.log('\nStopping development servers...');
  vite.kill('SIGINT');
  server.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', killChildren);
process.on('SIGTERM', killChildren);
process.on('exit', () => {
  vite.kill();
  server.kill();
});
