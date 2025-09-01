
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

## 🚀 Getting Started: Installing the Local Server

The "Installer" tab provides a script to set up a complete, persistent local development server for CODERS-AGI, optimized for Termux/proot-distro environments.

1.  **Navigate to the Installer Tab**: Open the application and click on the "Installer" tab in the control panel.

2.  **Generate the Installer Script**: Click the **"Generate Installer Script"** button. The new installer script will appear in the output viewer.

3.  **Download and Run**:
    - Use the **Download** button to save the generated script as `install.sh` or a similar name.
    - Open your terminal, make the script executable, and run it:
      ```bash
      chmod +x install.sh
      ./install.sh
      ```
    - The script will clone the repository, install Node.js (via nvm if needed), install project dependencies, and set up launcher scripts.

4.  **Start the Server**:
    - The installer adds an auto-start hook to your `~/.bashrc`. Open a new terminal session, and the server should start automatically in the background.
    - To manually start it or attach to the running session, use the new command:
      ```bash
      coders-agi
      ```
    - On Termux, this will also automatically open the URL `http://localhost:8888` in your browser.

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

Once the installer has run, two new commands are available in your shell:

-   **Start/Attach Server**: `coders-agi`
    -   Starts the server in a background `tmux` session if it's not running.
    -   Attaches to the running `tmux` session so you can see logs.
-   **Stop Server**: `coders-agi-stop`
    -   Kills the background `tmux` session, stopping the server.

The web application will be available at **http://localhost:8888** as long as the server is running.
