// The publication build: the ordinary build with the legal operator required and publishable (WORKS_PUBLICATION=1
// makes the legal pages refuse the fixture), then the publication gate over the result. The private projection
// WOLFSBLVT_LEGAL_OPERATOR_B64 must already be in the environment; this script never reads or prints it.
import { execSync } from 'node:child_process';

const env = { ...process.env, WORKS_PUBLICATION: '1' };
const run = (command) => {
  try {
    execSync(command, { stdio: 'inherit', env, windowsHide: true });
  } catch (error) {
    // The failing step has already printed its reason.
    process.exit(error.status ?? 1);
  }
};

run('npm run build');
run('node scripts/check-output.mjs');
run('node scripts/check-publish.mjs');
