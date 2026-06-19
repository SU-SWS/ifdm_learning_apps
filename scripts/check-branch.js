const { execSync } = require('child_process');

const allowedBranch = process.argv[2] || '1.x';

try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    if (branch !== allowedBranch) {
        console.error(`Deploy blocked: must be on branch '${allowedBranch}' (currently on '${branch}').`);
        process.exit(1);
    }
} catch (error) {
    console.warn('Could not determine git branch, proceeding with build...');
}
