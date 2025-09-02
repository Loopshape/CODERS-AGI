# AI / AGI / AIM Unified Tool GUI

This is a web-based graphical user interface for the "AI/AGI/AIM Unified Processing Tool," a command-line script designed to process files, interact with a local Ollama AI model, and manage the system environment. This UI provides a user-friendly way to access the script's core functionalities directly in your browser.

## ✨ Features

- **System Tab**:
    - **Installer (`ai init`)**: A one-click simulation to install the `ai` tool, which adapts `.bashrc` and copies the script to the user's bin directory.
    - **Environment Scan (`ai .`)**: Simulates a scan of the system environment, showing variables, disk usage, and more.
- **AI Modes**:
    - **Direct Input Processing**: Process raw text or fetch content from a URL to be analyzed by the local Ollama model.
    - **File Processing (`ai -`)**: Upload one or more files to apply the script's standard AI processing.
    - **Script Processing (`ai +`)**: A placeholder for future script-aware AI logic.
- **AGI Modes**: Placeholders simulating advanced functionalities that require direct filesystem access, such as watching a folder for changes (`ai agi +`).
- **Dynamic Output Viewer**:
    - View processed code or text output.
    - See a live HTML preview if the output is web content.
    - Monitor detailed logs of all operations in a clean, color-coded terminal-style interface.

## 🚀 Getting Started: Using the GUI

The GUI is designed to be a direct visual interface for the command-line script. All actions are simulations of what would happen in a real Termux or proot-distro environment.

### System Tab

This tab is for system-level operations.

1.  **Install Tool**: Click the **"Install `ai` Command"** button to simulate the `ai init` command. This will show logs indicating that the `.bashrc` file has been adapted and the script has been installed to `~/bin/ai`.
2.  **Scan Environment**: Click the **"Scan Environment"** button to simulate the `ai .` command. The output viewer will display a mock report of environment variables, disk usage, and directory listings.

### AI Tab

This is the primary tab for all AI-driven processing tasks.

-   **Direct Input**:
    1.  Enter text, paste code, or provide a URL in the respective input fields.
    2.  Click **"Process Input"**.
    3.  The UI will simulate sending this content to a local Ollama model and display the result. If Ollama isn't found, it will simply display the input back, as per the script's logic.
-   **File Processing**:
    1.  Drag and drop files onto the designated area or click to browse your local system.
    2.  Click **"Process File(s)"**.
    3.  The UI simulates running `ai - [your-files...]`. It will show logs indicating each file is backed up and then processed. Since the UI can't run Ollama, it will show the script's fallback behavior, which is to output a "universal law" into a `.processed` file.

### AGI Tab

This tab contains placeholders for advanced features that require direct filesystem access and cannot be run in a browser environment.

-   **Watch Mode**: Simulates the `ai agi +` command, which would normally watch a directory for file changes.
-   **Virtual Screenshot**: Simulates the `ai agi -` command.

---

## 💻 Command-Line Script Reference

The UI is based on the following script commands:

-   `ai init`: Installs the tool. (System Tab)
-   `ai .`: Scans the environment. (System Tab)
-   `ai [prompt|url|file]`: The default action. Processes input with Ollama. (AI Tab -> Direct Input)
-   `ai - [files...]`: Processes one or more files. (AI Tab -> File Processing)
-   `ai +`: Placeholder for script logic. (AI Tab)
-   `ai * [pattern]`: Batch processes files matching a pattern. (Represented by multi-file selection in the UI).
-   `ai :[f1:f2]`: Pipeline processing. (Represented by multi-file selection in the UI).
-   `ai agi + [folder]`: Watches a folder for changes. (AGI Tab)
-   `ai agi -`: Takes a virtual screenshot. (AGI Tab)
