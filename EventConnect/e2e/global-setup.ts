import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  const backendDir = path.resolve(__dirname, '../../../backendEventConnect');
  const seedScript = path.join(backendDir, 'src/utils/seedTestUser.js');
  try {
    const output = execSync(`node "${seedScript}"`, {
      encoding: 'utf-8',
      cwd: backendDir,
    });
    console.log('[global-setup]', output.trim());
  } catch (err: any) {
    console.error('[global-setup] Error al crear usuario de test:', err.message);
    throw err;
  }
}
