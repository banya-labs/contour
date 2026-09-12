import "server-only";
import net from "node:net";
import tls from "node:tls";
import { env } from "@/env";

type InvitationEmail = {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
  role?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

type SmtpSocket = net.Socket | tls.TLSSocket;

function readResponse(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return;
      const last = lines[lines.length - 1];
      if (/^\d{3} /.test(last)) {
        socket.off("data", onData);
        const code = Number(last.slice(0, 3));
        if (code >= 400) reject(new Error(`SMTP ${last}`));
        else resolve(buffer);
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

async function command(socket: SmtpSocket, value: string): Promise<void> {
  socket.write(`${value}\r\n`);
  await readResponse(socket);
}

async function connectToSmtp(): Promise<tls.TLSSocket> {
  const tlsMode = env.SMTP_SECURE === "true" || env.SMTP_PORT === 465;

  if (tlsMode) {
    const socket = tls.connect({ host: env.SMTP_HOST, port: env.SMTP_PORT, servername: env.SMTP_HOST });
    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });
    await readResponse(socket);
    return socket;
  }

  const socket = net.createConnection({ host: env.SMTP_HOST, port: env.SMTP_PORT });
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });
  await readResponse(socket);
  await command(socket, "EHLO contour.banyalabs.com");
  await command(socket, "STARTTLS");

  const secureSocket = tls.connect({ socket, servername: env.SMTP_HOST });
  await new Promise<void>((resolve, reject) => {
    secureSocket.once("secureConnect", resolve);
    secureSocket.once("error", reject);
  });
  await command(secureSocket, "EHLO contour.banyalabs.com");
  return secureSocket;
}

export async function sendOrganizationInvitation(data: InvitationEmail): Promise<void> {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("SMTP_USER and SMTP_PASSWORD are required to send organization invitations");
  }

  const socket = await connectToSmtp();
  if (env.SMTP_SECURE === "true" || env.SMTP_PORT === 465) {
    await command(socket, "EHLO contour.banyalabs.com");
  }
  await command(socket, "AUTH LOGIN");
  await command(socket, Buffer.from(env.SMTP_USER).toString("base64"));
  await command(socket, Buffer.from(env.SMTP_PASSWORD).toString("base64"));
  await command(socket, `MAIL FROM:<${env.SMTP_USER}>`);
  await command(socket, `RCPT TO:<${data.email}>`);
  await command(socket, "DATA");

  const subject = `${data.teamName} invited you to Contour`;
  const text = `${data.invitedByUsername} (${data.invitedByEmail}) invited you to join ${data.teamName} on Contour. Accept your invitation: ${data.inviteLink}`;
  const html = `<p><strong>${escapeHtml(data.invitedByUsername)}</strong> invited you to join <strong>${escapeHtml(data.teamName)}</strong> on Contour.</p><p>Your workspace role: <strong>${escapeHtml(data.role || "Member")}</strong></p><p><a href="${escapeHtml(data.inviteLink)}">Accept workspace invitation</a></p><p>This invitation link expires in 48 hours.</p>`;
  const message = [
    `From: ${env.SMTP_FROM || env.SMTP_USER}`,
    `To: ${data.email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="contour-boundary"',
    "",
    "--contour-boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    "--contour-boundary",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    "--contour-boundary--",
    ".",
  ].join("\r\n");
  await command(socket, message);
  await command(socket, "QUIT");
  socket.end();
}
