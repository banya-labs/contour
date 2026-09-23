import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";
import { FLYER_CANVAS, FlyerRenderModel } from "@/lib/flyer-render-model";

export type FlyerRenderAssets = {
  hero: string;
  secondaryOne: string;
  secondaryTwo: string;
  logo?: string;
  qrCode?: string;
};

let fontPromise: Promise<Array<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }>> | null = null;

async function getFonts() {
  if (!fontPromise) {
    fontPromise = Promise.all([
      fs.readFile(path.join(process.cwd(), "node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff")),
      fs.readFile(path.join(process.cwd(), "node_modules/@fontsource/roboto/files/roboto-latin-700-normal.woff")),
    ]).then(([regular, bold]) => [
      { name: "Roboto", data: regular, weight: 400, style: "normal" },
      { name: "Roboto", data: bold, weight: 700, style: "normal" },
    ]);
  }
  return fontPromise;
}

const image = (src: string, width: number, height: number, objectPosition = "center") => ({
  type: "img",
  props: { src, width, height, style: { width, height, objectFit: "cover", objectPosition } },
});

export async function renderFlyerSvg(model: FlyerRenderModel, assets: FlyerRenderAssets): Promise<string> {
  const canvas = FLYER_CANVAS[model.aspectRatio];
  const dark = model.template === "SWISS_DARK" || model.template === "NAVY_EDITORIAL";
  const padding = 32;
  const heroHeight = model.aspectRatio === "9:16" ? 960 : model.aspectRatio === "1:1" ? 650 : 820;
  const bodyHeight = canvas.height - heroHeight - 120;
  const fonts = await getFonts();
  const features = model.features.length ? model.features : ["Property details available on request"];

  const tree = {
    type: "div",
    props: {
      style: { width: canvas.width, height: canvas.height, display: "flex", flexDirection: "column", backgroundColor: dark ? "#282828" : "#ffffff", color: dark ? "#ffffff" : "#282828", fontFamily: "Roboto", overflow: "hidden" },
      children: [
        { type: "div", props: { style: { width: canvas.width, height: heroHeight, position: "relative", display: "flex", overflow: "hidden" }, children: [image(assets.hero, canvas.width, heroHeight), { type: "div", props: { style: { position: "absolute", left: padding, top: padding, display: "flex", padding: 16, backgroundColor: "#ffffff", color: "#282828", fontSize: 24, fontWeight: 700, maxWidth: canvas.width - padding * 2 }, children: model.agencyName } }, { type: "div", props: { style: { position: "absolute", right: padding, bottom: padding, padding: "8px 12px", backgroundColor: "#000000", color: "#ffffff", fontSize: 18 }, children: `${model.suburb}, Lusaka` } }] } },
        { type: "div", props: { style: { height: bodyHeight, padding, display: "flex", flexDirection: "row", gap: 24, overflow: "hidden" }, children: [
          { type: "div", props: { style: { width: canvas.width * 0.58, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }, children: [
            { type: "div", props: { style: { color: "#fa3600", fontSize: 18, fontWeight: 700, letterSpacing: 2 }, children: model.isSale ? "EXCLUSIVE MANDATE" : "AVAILABLE FOR LEASE" } },
            { type: "div", props: { style: { fontSize: 34, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.05, maxHeight: 76, overflow: "hidden" }, children: model.title } },
            { type: "div", props: { style: { fontSize: 18, lineHeight: 1.35, color: dark ? "#dddddd" : "#666666", maxHeight: 122, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5 }, children: model.copy } },
            { type: "div", props: { style: { display: "flex", padding: "10px 12px", backgroundColor: "#000000", color: "#ffffff", fontSize: 20, fontWeight: 700 }, children: model.isSale ? "HOME FEATURES" : "RENTAL HIGHLIGHTS" } },
            { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 7, fontSize: 17, lineHeight: 1.15, overflow: "hidden" }, children: features.map((feature) => ({ type: "div", props: { style: { display: "flex", gap: 8, maxHeight: 40, overflow: "hidden" }, children: [{ type: "span", props: { style: { color: "#fa3600", fontWeight: 700 }, children: "+" } }, feature] } })) } },
          ] } },
          { type: "div", props: { style: { width: canvas.width * 0.42 - 24, display: "flex", flexDirection: "column", gap: 16 }, children: [
            { type: "div", props: { style: { padding: 20, backgroundColor: "#282828", color: "#ffffff", textAlign: "center", fontSize: 26, fontWeight: 700 }, children: `${model.currency} ${model.price == null ? "—" : new Intl.NumberFormat("en-US").format(model.price)}` } },
            { type: "div", props: { style: { display: "flex", gap: 8 }, children: [image(assets.secondaryOne, 170, 170), image(assets.secondaryTwo, 170, 170)] } },
          ] } },
        ] } },
        { type: "div", props: { style: { height: 120, display: "flex", alignItems: "center", backgroundColor: "#000000", color: "#ffffff", padding: "16px 24px", gap: 20, fontSize: 20 }, children: [assets.qrCode ? image(assets.qrCode, 88, 88, "center") : "", `CONTACT ${model.contact.name} • WhatsApp ${model.contact.phone}`] } },
      ],
    },
  };

  return satori(tree as never, { ...canvas, fonts, embedFont: true, pointScaleFactor: 2 });
}

export async function renderFlyerPng(model: FlyerRenderModel, assets: FlyerRenderAssets): Promise<Buffer> {
  const svg = await renderFlyerSvg(model, assets);
  const canvas = FLYER_CANVAS[model.aspectRatio];
  return sharp(Buffer.from(svg)).png().resize(canvas.width, canvas.height, { fit: "fill" }).toBuffer();
}
