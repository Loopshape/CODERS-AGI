
# AI / AGI / AIM Unified Tool GUI

This is a web-based graphical user interface for the powerful "AI/AGI/AIM Unified Tool," a command-line script designed to enhance files, interact with AI models, and manage development workflows. This UI provides a user-friendly way to access the script's core functionalities directly in your browser.

![AI Unified Tool GUI Screenshot](https://i.imgur.com/your-screenshot.png) <!-- Placeholder for a future screenshot -->

## ✨ Features

- **Installer Tab**: A guided, step-by-step process to generate the necessary scripts and configuration for the command-line tool.
- **AI Modes**:
    - **File Processing**: Upload files to apply predefined enhancement rules.
    - **Gemini Code Review**: Get an in-depth code quality analysis for a file, powered by the Google Gemini API.
    - **Environment Scan**: Simulate a scan of the system environment.
- **AGI Modes**: Placeholders simulating advanced functionalities like file system watching.
- **Git Integration**: A simple UI to perform basic Git operations: `init`, `add`, `commit`, and `push`.
- **Direct Prompting**:
    - Process raw text through the AI.
    - Fetch content from a URL and process or enhance it with Gemini AI.
- **Dynamic Output Viewer**:
    - View processed code with syntax highlighting.
    - See a live HTML preview of your output.
    - Monitor detailed logs of all operations in a clean, color-coded interface.

## 🚀 Getting Started: Installing the CLI Tool

The primary purpose of the "Installer" tab in this GUI is to help you set up the `ai` command-line tool on your system (especially for Termux/proot-distro environments).

1.  **Navigate to the Installer Tab**: Open the application and click on the "Installer" tab in the control panel.

2.  **Step 1: Generate the Script**:
    - Click the **"Generate `ai` Installer Script"** button.
    - The `ai` shell script will appear in the output viewer.
    - Use the **Download** button to save the script to your local machine (as `ai`).

3.  **Step 2: Make it Executable**:
    - Move the downloaded `ai` script to a directory in your `PATH`, like `~/bin` or `~`.
    - Open your terminal and run the following command:
      ```bash
      chmod +x ai
      ```

4.  **Step 3: Initialize the Environment**:
    - Run the script's built-in installer:
      ```bash
      ./ai init
      ```
    - This command will:
        - Create a backup of your existing `~/.bashrc`.
        - Add the necessary aliases and `PATH` configurations to a new `~/.bashrc`.
        - Copy itself to `~/bin/ai` for system-wide access.

5.  **Step 4: Reload Your Shell**:
    - To apply the changes, either restart your terminal session or run:
      ```bash
      source ~/.bashrc
      ```
    - You can now use the `ai` command from anywhere in your terminal!

## 🖥️ Using the GUI

### AI Modes Tab

1.  **Select Files**: Drag and drop your files onto the designated area or click to browse your local system.
2.  **Choose an Action**:
    - **Process File(s)**: Applies the script's standard regex-based enhancements.
    - **Review with Gemini AI**: Sends the *first selected file* to the Google Gemini API for a detailed code review.
    - **Scan Environment**: Simulates running the environment scan.

### AGI & Git Tabs

-   **AGI Modes**: Contains placeholders for features that require direct filesystem access and cannot be run in a browser.
-   **Git**: Provides a simple, step-by-step form to simulate `git` commands. The output and logs will reflect the simulated actions.

### Direct Prompt Tab

-   **From Text**: Type or paste any text into the textarea and click "Process Text Prompt."
-   **From URL**: Enter a URL to fetch its content.
    - **Fetch & Process**: Applies the standard script processing to the URL's content.
    - **Fetch & Enhance**: Sends the URL's content to the Gemini API for intelligent enhancement.

---

## 💻 Command-Line Usage (Quick Reference)

Once installed, you can use the script directly from your terminal.

-   **Initialize Installer**: `ai init`
-   **Process Files**: `ai - [file1] [file2] ...`
-   **Process Script Logic**: `ai + [file]`
-   **Batch Process**: `ai * "*.js"`
-   **Scan Environment**: `ai .`
-   **Pipeline Processing**: `ai : "file1:file2:file3"`
-   **Run a Prompt**: `ai "your prompt here"` or `ai https://example.com`
-   **Watch a Folder (AGI)**: `ai agi + /path/to/folder`

This GUI provides a safe and intuitive way to explore these features before, during, and after you've installed the command-line tool.
