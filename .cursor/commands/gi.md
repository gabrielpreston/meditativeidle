# GitIngest - Generate library digest

## Overview

Generate a GitIngest digest file for a GitHub repository (by library name or direct URL) and store it in `docs/gitingest/`.

## Steps

1. **Parse input**
   - Accept either a library name (e.g., `three.js`, `webgl-fluid-enhanced`) or a direct GitHub URL (e.g., `https://github.com/mrdoob/three.js`)
   - If a library name is provided, attempt to construct a GitHub URL using common patterns:
     - Try `https://github.com/{library-name}/{library-name}`
     - Try `https://github.com/{library-name}/{library-name}.js`
     - If uncertain, ask the user for the full GitHub URL or search for the repository

2. **Activate virtual environment and verify GitIngest installation**
   - **Activate the `.venv` environment** before running any gitingest commands:
     ```bash
     source .venv/bin/activate
     ```
   - Check if `gitingest` CLI is available by running: `gitingest --version`
   - If not installed, inform the user they need to install it in the virtual environment:
     ```bash
     # Ensure .venv is activated first
     source .venv/bin/activate
     pip install gitingest
     ```
   - If installation is needed, wait for user confirmation before proceeding
   - **Important**: All gitingest commands must be run with the `.venv` environment activated

3. **Generate digest filename**
   - Extract repository owner and name from the GitHub URL
   - Generate a filename pattern: `{owner}-{repo}-{hash}.txt`
   - Use a short hash (first 8 characters) of the repository URL or generate a hash from the URL for uniqueness
   - Example: `mrdoob-three.js-8a5edab2.txt`
   - Ensure the filename is valid (replace special characters, handle case sensitivity)

4. **Run GitIngest (with timeout workaround)**
   - **Ensure the `.venv` environment is activated** before running the command:
     ```bash
     source .venv/bin/activate
     ```
   - **Use manual clone approach to avoid timeout issues**: GitIngest has a hardcoded 60-second timeout that can fail on large repositories. To work around this, clone the repository manually first, then ingest the local directory:
     ```bash
     # Create a temporary directory for cloning
     TEMP_CLONE_DIR=$(mktemp -d)
     
     # Clone the repository manually (no timeout)
     git clone --depth=1 {github_url} "$TEMP_CLONE_DIR/$(basename {github_url})"
     
     # Ingest the local directory (no clone timeout)
     gitingest "$TEMP_CLONE_DIR/$(basename {github_url})" -o docs/gitingest/{filename}
     
     # Clean up the temporary clone
     rm -rf "$TEMP_CLONE_DIR"
     ```
   - **Alternative (if direct URL works)**: Try direct URL first, but fall back to manual clone if timeout occurs:
     ```bash
     # Try direct URL first
     gitingest {github_url} -o docs/gitingest/{filename} || {
       # If timeout occurs, use manual clone approach
       TEMP_CLONE_DIR=$(mktemp -d)
       git clone --depth=1 {github_url} "$TEMP_CLONE_DIR/$(basename {github_url})"
       gitingest "$TEMP_CLONE_DIR/$(basename {github_url})" -o docs/gitingest/{filename}
       rm -rf "$TEMP_CLONE_DIR"
     }
     ```
   - **Note**: The command must be run with `.venv` activated to access the gitingest tool
   - Use appropriate flags for filtering if needed:
     - `-i "*.py" -i "*.js"` for specific file types
     - `-e "node_modules/*" -e "*.lock"` to exclude dependencies
     - `-s 102400` to limit file sizes (100KB default)
   - For private repositories, check for `GITHUB_TOKEN` environment variable and use `-t $GITHUB_TOKEN` flag if needed
   - Handle any errors during execution and provide helpful error messages

5. **Verify output**
   - Check that the file was created successfully in `docs/gitingest/`
   - Read the first few lines of the file to verify it contains the expected GitIngest format:
     - Repository summary (Repository: owner/repo-name)
     - Directory structure (tree view)
     - File contents with delimiters (================================================)
   - Display a summary of what was ingested (file count, estimated tokens from the summary section)

6. **Report completion**
   - Confirm the file was created successfully
   - Display the file path: `docs/gitingest/{filename}`
   - Show a brief summary from the digest (repository name, files analyzed, estimated tokens)
   - Note that the file is gitignored and won't be committed to the repository

## Error Handling

- **Repository not found**: Suggest checking the URL or library name, offer to search GitHub
- **Authentication failed**: Remind about `GITHUB_TOKEN` environment variable for private repos
- **GitIngest not installed**: Provide clear installation instructions - ensure `.venv` is activated first, then `pip install gitingest`
- **Command not found**: If `gitingest` command is not found, verify that `.venv` is activated using `source .venv/bin/activate`
- **Clone timeout**: If git clone times out after 60 seconds (error: "Operation timed out after 60 seconds"), use the manual clone approach:
  ```bash
  TEMP_CLONE_DIR=$(mktemp -d)
  git clone --depth=1 {github_url} "$TEMP_CLONE_DIR/$(basename {github_url})"
  gitingest "$TEMP_CLONE_DIR/$(basename {github_url})" -o docs/gitingest/{filename}
  rm -rf "$TEMP_CLONE_DIR"
  ```
  This avoids GitIngest's hardcoded 60-second timeout by cloning manually first, then ingesting the local directory.
- **Repository too large**: Suggest using filtering flags (`-s`, `-i`, `-e`) to reduce output size
- **Invalid filename**: Handle special characters and ensure valid filesystem naming

## Usage Examples

**Direct GitHub URL:**
```
@gi https://github.com/mrdoob/three.js
```
The AI will automatically activate `.venv` before running the gitingest command.

**Library name (will attempt to construct URL):**
```
@gi three.js
```
The AI will automatically activate `.venv` before running the gitingest command.

**Manual execution (for reference):**
```bash
# Activate virtual environment
source .venv/bin/activate

# Use manual clone approach to avoid timeout (recommended for large repos)
TEMP_CLONE_DIR=$(mktemp -d)
git clone --depth=1 https://github.com/mrdoob/three.js "$TEMP_CLONE_DIR/three.js"
gitingest "$TEMP_CLONE_DIR/three.js" -o docs/gitingest/mrdoob-three.js-8a5edab2.txt
rm -rf "$TEMP_CLONE_DIR"

# Alternative: Try direct URL first, fall back to manual clone if timeout
gitingest https://github.com/mrdoob/three.js -o docs/gitingest/mrdoob-three.js-8a5edab2.txt || {
  TEMP_CLONE_DIR=$(mktemp -d)
  git clone --depth=1 https://github.com/mrdoob/three.js "$TEMP_CLONE_DIR/three.js"
  gitingest "$TEMP_CLONE_DIR/three.js" -o docs/gitingest/mrdoob-three.js-8a5edab2.txt
  rm -rf "$TEMP_CLONE_DIR"
}
```

## Notes

- **Virtual Environment Required**: All gitingest commands must be run with the `.venv` environment activated using `source .venv/bin/activate`
- **Timeout Workaround**: GitIngest has a hardcoded 60-second timeout for git clone operations. For large repositories, use the manual clone approach (clone first, then ingest locally) to avoid timeout issues
- Output files are stored in `docs/gitingest/` directory
- Files follow naming pattern: `{owner}-{repo}-{hash}.txt`
- All `.txt` files in `docs/gitingest/` are gitignored (see `.gitignore`)
- For large repositories, consider using filtering flags (`-s`, `-i`, `-e`) to reduce output size
- Private repositories require `GITHUB_TOKEN` environment variable
- GitIngest CLI must be installed in the `.venv` environment: `pip install gitingest` (with venv activated)

