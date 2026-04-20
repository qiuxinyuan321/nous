"""
Generate PWA icons (192×192, 512×512, 1024×1024) + Apple touch icon.

Design: rice-paper background + tilted cinnabar seal with the character "思".
Centered composition, scales down gracefully.

Run:  python scripts/gen-pwa-icons.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"

PAPER_RICE = (250, 247, 239)
PAPER_AGED = (242, 235, 216)
INK_HEAVY = (28, 27, 25)
CINNABAR = (184, 55, 47)
CINNABAR_DEEP = (142, 40, 34)
GOLD_LEAF = (184, 149, 90)

KAI = Path("C:/Windows/Fonts/simkai.ttf")  # 楷体
SONG = Path("C:/Windows/Fonts/simsun.ttc")


def render_icon(size: int) -> Image.Image:
    canvas = Image.new("RGB", (size, size), PAPER_RICE)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # 宣纸微光晕
    veil = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    vd.ellipse(
        (int(size * 0.1), int(size * 0.1), int(size * 0.9), int(size * 0.9)),
        fill=PAPER_AGED + (90,),
    )
    veil = veil.filter(ImageFilter.GaussianBlur(radius=size * 0.05))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), veil).convert("RGB")
    draw = ImageDraw.Draw(canvas, "RGBA")

    # 朱砂印章
    seal_side = int(size * 0.62)
    seal_layer = Image.new("RGBA", (seal_side, seal_side), (0, 0, 0, 0))
    sd = ImageDraw.Draw(seal_layer)
    radius = max(6, int(size * 0.02))
    # 主色
    sd.rounded_rectangle(
        (0, 0, seal_side, seal_side), radius=radius, fill=CINNABAR + (235,)
    )
    # 内圈描边 (深一级朱砂)
    inset = max(3, int(size * 0.014))
    sd.rounded_rectangle(
        (inset, inset, seal_side - inset, seal_side - inset),
        radius=max(3, radius - 2),
        outline=CINNABAR_DEEP + (180,),
        width=max(1, int(size * 0.006)),
    )
    # "思" 字
    font_size = int(seal_side * 0.62)
    font = ImageFont.truetype(str(KAI), font_size)
    text = "思"
    bbox = sd.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (seal_side - tw) // 2 - bbox[0]
    ty = (seal_side - th) // 2 - bbox[1] - int(size * 0.004)
    sd.text((tx, ty), text, font=font, fill=PAPER_RICE)

    # 轻微做旧/斑驳: 在印上随机洒一些透明点
    import random

    random.seed(42)
    grit = Image.new("RGBA", (seal_side, seal_side), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grit)
    for _ in range(int(seal_side * 0.6)):
        x = random.randint(0, seal_side - 1)
        y = random.randint(0, seal_side - 1)
        r = random.randint(1, max(2, int(size * 0.004)))
        gd.ellipse((x - r, y - r, x + r, y + r), fill=(250, 247, 239, 90))
    seal_layer = Image.alpha_composite(seal_layer, grit)

    # 轻微旋转 -6°
    seal_layer = seal_layer.rotate(-6, resample=Image.BICUBIC, expand=True)

    # 贴到画布中心
    sw, sh = seal_layer.size
    cx = (size - sw) // 2
    cy = (size - sh) // 2
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(seal_layer, (cx, cy))

    # 右下角泥金"一笔"点缀
    accent_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ad = ImageDraw.Draw(accent_layer)
    x0 = int(size * 0.78)
    y0 = int(size * 0.82)
    w = int(size * 0.08)
    ad.rectangle((x0, y0, x0 + w, y0 + max(2, int(size * 0.008))), fill=GOLD_LEAF + (160,))
    canvas.alpha_composite(accent_layer, (0, 0))

    return canvas.convert("RGB")


def main() -> None:
    # 1024 master
    master = render_icon(1024)
    master.save(OUT / "icon-1024.png", optimize=True)

    # 512 PWA (maskable / any)
    master.resize((512, 512), Image.LANCZOS).save(OUT / "icon-512.png", optimize=True)

    # 192 PWA
    master.resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png", optimize=True)

    # 180 Apple touch icon (iOS requires square bg, no transparency)
    master.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)

    # 32 favicon fallback (Next.js app/favicon.ico takes precedence, but keep)
    master.resize((32, 32), Image.LANCZOS).save(OUT / "favicon-32.png", optimize=True)

    for p in [
        OUT / "icon-1024.png",
        OUT / "icon-512.png",
        OUT / "icon-192.png",
        OUT / "apple-touch-icon.png",
        OUT / "favicon-32.png",
    ]:
        print(f"{p.name}  {p.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
