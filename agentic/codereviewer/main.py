import os
import subprocess

class CodeReviewer:
    def __init__(self, repo_path):
        self.repo_path = repo_path

    def review_pr(self, pr_url):
        """
        Reviews a pull request and returns a summary of the changes.
        """
        diff = self._get_pr_diff(pr_url)
        # In a real implementation, you would use an LLM to analyze the diff
        # and provide a review.
        return f"Code review for {pr_url}:\n\n{diff}"

    def _get_pr_diff(self, pr_url):
        """
        Gets the diff of a pull request using the gh cli.
        """
        command = ["gh", "pr", "diff", pr_url]
        try:
            # Change the current working directory to the repository path
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=self.repo_path)
            stdout, stderr = process.communicate()
            if process.returncode != 0:
                raise Exception(f"Error getting PR diff: {stderr.decode('utf-8')}")
            return stdout.decode("utf-8")
        except FileNotFoundError:
            raise Exception("The 'gh' command is not installed or not in your PATH.")

if __name__ == "__main__":
    # Example usage:
    # Make sure you have the gh cli installed and are authenticated.
    # The repository path should be the path to the repository you want to review.
    # The PR URL should be the URL of the pull request you want to review.
    repo_path = "/path/to/your/repo"
    pr_url = "https://github.com/owner/repo/pull/123"
    reviewer = CodeReviewer(repo_path)
    review = reviewer.review_pr(pr_url)
    print(review)
