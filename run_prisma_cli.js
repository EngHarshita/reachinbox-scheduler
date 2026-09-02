const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== EXECUTING PRISMA GENERATE ===');
try {
  const prismaBin = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  const genOutput = execSync(`node "${prismaBin}" generate --schema="${schemaPath}"`, { 
    cwd: __dirname,
    encoding: 'utf-8' 
  });
  console.log('GENERATION OUTPUT:\n', genOutput);

  const pushOutput = execSync(`node "${prismaBin}" db push --schema="${schemaPath}" --accept-data-loss`, { 
    cwd: __dirname,
    encoding: 'utf-8' 
  });
  console.log('DB PUSH OUTPUT:\n', pushOutput);

  // Write output log file to confirm execution
  fs.writeFileSync(path.join(__dirname, 'prisma_gen_log.txt'), genOutput + '\n' + pushOutput);
} catch (err) {
  console.error('Prisma CLI Error:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.error('STDERR:', err.stderr.toString());
  fs.writeFileSync(path.join(__dirname, 'prisma_gen_log.txt'), err.message + '\n' + (err.stdout || '') + '\n' + (err.stderr || ''));
}
