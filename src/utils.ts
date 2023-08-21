const Base64 = require("base64-js");

const svgPartOne =
  '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><circle cx="18" cy="18" r="62" style="fill:#0092ff"/><path d="M516.3 361.83c60.28 0 108.1 37.18 126.26 92.47H764C742 336.09 644.47 256 517.27 256 372.82 256 260 365.65 260 512.49S370 768 517.27 768c124.35 0 223.82-80.09 245.84-199.28H642.55c-17.22 55.3-65 93.45-125.32 93.45-83.23 0-141.56-63.89-141.56-149.68.04-86.77 57.43-150.66 140.63-150.66z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#e088fb"/><stop offset="1" stop-color="#74f7ff" stop-opacity="1"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Noto Serif Vithkuqi Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
const svgPartTwo = "</text></svg>";

export const generateSVG = (domainName: string) => {
  return svgPartOne + domainName + svgPartTwo;
};

export const generateMetadata = (
  id: string,
  domainName: string,
  svg: string
) => {
  const json = {
    tokenId: id,
    name: domainName,
    description: "A domain on the test name service",
    external_url: "https://baseid.domain",
    image: "data:image/svg+xml;base64," + encodeSVGToBase64(svg),
  };
  return json;
};

// Encode SVG to base64
export const encodeSVGToBase64 = (svg: string) => {
  const svgBytes = new TextEncoder().encode(svg);
  const base64 = Base64.fromByteArray(svgBytes);
  return base64;
};
