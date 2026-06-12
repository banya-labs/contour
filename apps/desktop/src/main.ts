import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getLaunchTarget } from "./get-launch-target";

const require = createRequire(import.meta.url);
const { app, BrowserWindow } = require("electron") as typeof import("electron");
const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

app.setPath("userData", join(tmpdir(), "contour-analytics-engine"));

function resolveContourIcon() {
  const candidates = [
    join(process.cwd(), "img", "logo.ico"),
    join(process.cwd(), "..", "img", "logo.ico"),
    join(process.cwd(), "..", "..", "img", "logo.ico"),
    join(currentDir, "..", "..", "img", "logo.ico"),
    join(currentDir, "..", "..", "..", "img", "logo.ico"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1600,
    height: 1100,
    minWidth: 1280,
    minHeight: 900,
    backgroundColor: "#fdfbfa",
    title: "Contour Analytics Engine",
    icon: resolveContourIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  void window.loadURL(getLaunchTarget());
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
