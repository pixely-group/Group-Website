// The preview's launcher (.claude/launch.json → "dev").
//
// Next allows one `next dev` per project folder, and this project is often
// already being served from a terminal on :3000 — so starting a second one
// for the preview pane failed with "Another next dev server is already
// running". This launcher looks first:
//
//   - If a server already answers on :3000, it does not start another. It
//     listens on the port the preview assigned (PORT) and forwards to :3000,
//     WebSocket upgrades included, so hot reload works through it.
//   - Otherwise it starts `next dev` on PORT, exactly as `npm run dev` would.
//
// usage: node scripts/preview-dev.mjs   (PORT is set by the preview)

import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";

const TARGET = Number(process.env.PREVIEW_ATTACH_PORT || 3000);
const PORT = Number(process.env.PORT || 3000);

/** Whether something already answers HTTP on the target port. */
const alive = () =>
  new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port: TARGET, path: "/", timeout: 2000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(false));
  });

if (PORT !== TARGET && (await alive())) {
  const server = http.createServer((req, res) => {
    const upstream = http.request(
      { host: "127.0.0.1", port: TARGET, path: req.url, method: req.method, headers: req.headers },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end("The dev server on :" + TARGET + " stopped answering.");
    });
    req.pipe(upstream);
  });
  // Hot reload runs over a WebSocket: hand the upgrade to the target as-is.
  server.on("upgrade", (req, socket, head) => {
    const up = net.connect(TARGET, "127.0.0.1", () => {
      up.write(
        `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
          Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") +
          "\r\n\r\n",
      );
      if (head?.length) up.write(head);
      socket.pipe(up).pipe(socket);
    });
    up.on("error", () => socket.destroy());
    socket.on("error", () => up.destroy());
  });
  server.listen(PORT, () => {
    console.log(`▲ Using the dev server already running on :${TARGET}`);
    console.log(`- Local:         http://localhost:${PORT} → http://localhost:${TARGET}`);
  });
} else {
  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], { stdio: "inherit" });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
  child.on("exit", (code) => process.exit(code ?? 0));
}
