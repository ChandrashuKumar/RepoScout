import { Octokit } from '@octokit/rest'

const octokit = new Octokit();

export const getRepoFileCount = async (repoUrl: string): Promise<number> => {
    try {
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) throw new Error('Invalid Github URL');

        const [_, owner, repoName] = match;
        const cleanRepoName = repoName.replace('.git', '');

        const { data } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1', {
            owner,
            repo: cleanRepoName,
        });

        if (data.truncated) {
            console.warn('Repo is too massive, tree was truncated');
            return 9999;
        }

        const IGNORED_EXTENSIONS = new Set([
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.map', '.css', '.scss','.config', '.csv', '.pdf'
        ]);

        const validFiles = data.tree.filter((node: any) => {
            if (node.type !== 'blob') return false;

            const path = node.path || "";
            if (path.includes('node_modules') ||
                path.includes('.git') ||
                path.includes('dist') ||
                path.includes('build') ||
                path.includes('coverage') ||
                path.includes('test') ||
                path.includes('vendor')) return false;

            const ext = path.split('.').pop()?.toLowerCase() || '';
            return !IGNORED_EXTENSIONS.has(`.${ext}`);
        });
        return validFiles.length;
    } catch (error) {
        console.error("GitHub API Error:", error);
        return -1;  // Indicates API failure, caller should handle
    }
}