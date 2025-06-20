const { execSync } = require('child_process');

try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    if (branch !== '1.x') {
        console.error(`Build blocked on branch: ${branch}`);
        console.error('Builds are not allowed on this branch.');
        process.exit(1);
    }
} catch (error) {
    console.warn('Could not determine git branch, proceeding with build...');
}
