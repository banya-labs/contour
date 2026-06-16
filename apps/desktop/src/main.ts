import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { v4 as uuidv4 } from "uuid";
import { getLaunchTarget } from "./get-launch-target";
import { initializeDatabase } from "./database";
import { initializeSync, stopSync } from "./sync-manager";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require("electron") as typeof import("electron");
const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

// Set user data path for consistent storage
const userDataPath = join(tmpdir(), "contour-analytics-engine");
app.setPath("userData", userDataPath);

// Initialize database on app startup
initializeDatabase();

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
      preload: join(currentDir, "preload.js"),
    },
  });

  void window.loadURL(getLaunchTarget());
  return window;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();

  // Initialize sync with a device ID (stored persistently in production)
  const deviceId = uuidv4();
  const userId = process.env.CONTOUR_USER_ID || "local-user";
  const appVersion = app.getVersion();
  const apiUrl = process.env.CONTOUR_API_URL || "http://localhost:3000";

  initializeSync({
    apiUrl,
    deviceId,
    userId,
    appVersion,
    onSyncStart: () => {
      mainWindow.webContents.send("sync:start");
    },
    onSyncProgress: (message) => {
      mainWindow.webContents.send("sync:progress", message);
    },
    onSyncComplete: (result) => {
      mainWindow.webContents.send("sync:complete", result);
    },
    onSyncError: (error) => {
      mainWindow.webContents.send("sync:error", error.message);
    },
    onOfflineStatusChange: (offline) => {
      mainWindow.webContents.send("sync:offline", offline);
    },
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopSync();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers for renderer process
ipcMain.on("sync:trigger", async (_event) => {
  // Trigger sync from renderer
  console.log("[v0] Sync triggered from renderer");
});

ipcMain.handle("app:version", () => {
  return app.getVersion();
});

ipcMain.handle("app:is-online", () => {
  // In production, check actual network status
  return navigator?.onLine ?? true;
});
