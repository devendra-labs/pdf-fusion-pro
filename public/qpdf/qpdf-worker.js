/* global FS, callMain */

const basePath = "/qpdf/";

let errorOrWarning = "";

function stdout(text) {
  self.postMessage({
    type: "stdout",
    line: String(text),
  });
}

function debugLog(type, ...args) {
  const message = args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack ?? ""}`;
      }

      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }

      return String(arg);
    })
    .join(" ");

  stdout(`[${type}] ${message}`);
}

const Module = {
  thisProgram: "qpdf",
  noInitialRun: true,

  print(text) {
    stdout(text);
  },

  printErr(text) {
    const message = String(text);

    if (message.startsWith("WARNING: ")) {
      errorOrWarning = message.slice(9);
    }

    stdout(`[stderr] ${message}`);
  },

  onRuntimeInitialized() {
    debugLog("init", "QPDF runtime initialized");

    self.postMessage({
      type: "ready",
    });
  },

  locateFile(path) {
    if (path.endsWith(".wasm")) {
      return `${basePath}lib/${path}`;
    }

    return `${basePath}lib/${path}`;
  },

  quit(status, toThrow) {
    debugLog(
      "quit",
      `Program quit with status: ${status}`,
    );

    if (toThrow) {
      throw status;
    }
  },
};

/*
 * IMPORTANT:
 * Use an absolute HTTP path.
 *
 * Do NOT use:
 * importScripts(basePath + "lib/qpdf.js")
 *
 * because that was producing file:///qpdf/... in the
 * previous worker setup.
 */
try {
  importScripts("/qpdf/lib/qpdf.js");

  debugLog(
    "worker",
    "qpdf.js loaded successfully",
  );
} catch (error) {
  debugLog(
    "worker",
    "Failed to load qpdf.js",
    error,
  );

  self.postMessage({
    type: "error",
    message:
      error instanceof Error
        ? error.message
        : String(error),
  });
}

function getFileData(fileName) {
  try {
    if (!FS.analyzePath(fileName).exists) {
      debugLog(
        "getFileData",
        `File ${fileName} does not exist`,
      );

      return null;
    }

    const data = FS.readFile(fileName, {
      encoding: "binary",
    });

    return data;
  } catch (error) {
    debugLog(
      "getFileData",
      "Error reading file",
      error,
    );

    return null;
  }
}

self.onmessage = function (event) {
  const message = event.data;

  if (!message || !message.type) {
    return;
  }

  switch (message.type) {
    case "save": {
      const filename = message.filename;
      const arrayBuffer = message.arrayBuffer;

      try {
        debugLog(
          "save",
          `Saving ${filename}`,
        );

        if (
          !(arrayBuffer instanceof ArrayBuffer) &&
          !ArrayBuffer.isView(arrayBuffer)
        ) {
          throw new Error(
            "Invalid input data type.",
          );
        }

        if (FS.analyzePath(filename).exists) {
          FS.unlink(filename);
        }

        const data =
          arrayBuffer instanceof ArrayBuffer
            ? new Uint8Array(arrayBuffer)
            : new Uint8Array(
                arrayBuffer.buffer,
                arrayBuffer.byteOffset,
                arrayBuffer.byteLength,
              );

        FS.createDataFile(
          "/",
          filename,
          data,
          true,
          false,
        );

        self.postMessage({
          type: "saved",
          filename,
        });
      } catch (error) {
        self.postMessage({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }

      break;
    }

    case "run": {
      try {
        const args = message.args ?? [];

        debugLog(
          "run",
          `Executing qpdf with ${args.length} arguments`,
        );

        const result = callMain(args);

        const outputName =
          message.outputName ??
          "compressed.pdf";

        const output = getFileData(outputName);

        if (!output) {
          throw new Error(
            `QPDF did not create ${outputName}.`,
          );
        }

        const outputBuffer = new Uint8Array(
          output,
        ).buffer;

        self.postMessage(
          {
            type: "result",
            outputName,
            arrayBuffer: outputBuffer,
          },
          [outputBuffer],
        );
      } catch (error) {
        debugLog(
          "run",
          "QPDF execution failed",
          error,
        );

        self.postMessage({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }

      break;
    }

    default:
      debugLog(
        "worker",
        `Unknown message type: ${message.type}`,
      );
  }
};