const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Find all accounts in your Environment Variables (SESSION_ID_1, SESSION_ID_2...)
const sessions = Object.keys(process.env)
  .filter(k => k.startsWith('SESSION_ID_'))
  .sort();

if (sessions.length === 0) {
  console.error("❌ No SESSION_ID_1, SESSION_ID_2, etc. found!");
  process.exit(1);
}

console.log(`🚀 Found ${sessions.length} accounts. Starting isolation...`);

sessions.forEach((key, index) => {
  const id = process.env[key];
  const accountDir = path.join(process.cwd(), `account_${index + 1}`);

  // 2. Create a private folder for each account
  if (!fs.existsSync(accountDir)) fs.mkdirSync(accountDir);

  // 3. Link the platform config file so the bot can read it
  const configSrc = path.join(process.cwd(), 'cx-platform.json');
  const configDest = path.join(accountDir, 'cx-platform.json');
  if (fs.existsSync(configSrc) && !fs.existsSync(configDest)) {
    fs.copyFileSync(configSrc, configDest);
  }

  console.log(`✅ Launching Account ${index + 1} (Variable: ${key})`);

  // 4. Run the bot! We run '../index.js' so it uses the main node_modules
  const child = spawn('node', [path.join(process.cwd(), 'index.js')], {
    cwd: accountDir,
    env: { ...process.env, SESSION_ID: id }
  });

  // 5. Pipe logs to the main window
  child.stdout.on('data', (data) => process.stdout.write(`[Acc ${index + 1}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[Acc ${index + 1} ERROR] ${data}`));
});

// Keep the manager alive
setInterval(() => {}, 1000);

