# _ : Centralized Autonomic Intelligence Platform (AIP) Repository

This is the central repository for the **2244-1 Autonomic Intelligence Platform (AIP)**.
The core executable, `ai.sh`, implements a multi-model reasoning framework that runs five specialized models in parallel (`core`, `loop`, `code`, `coin`, `2244`) and fuses their output using a high-level synthetic intelligence model called **'Soul' (`neuro`)**.

The structure is designed for minimal footprint in the home directory, aligning with the "CODERS-AGI" repository style:

- `ai/ai.sh`: The main executable script.
- `README.md`: This file.
- `.`: Git repository root.

## Usage

1. **Make it executable:**
    ```bash
    chmod +x ai/ai.sh
    ```
2. **Run:**
    ```bash
    ./ai/ai.sh "Your query for the autonomic mind"
    ```
