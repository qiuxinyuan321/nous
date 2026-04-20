"""
Generate GitHub social preview banner (1280×640) from hero.jpg.

- Reads public/hero.jpg, resizes to 1280×640 (16:9 crop)
- Overlays "NOUS" title + tagline in the bright left negative space
- Writes to docs/og-banner.png

Run:  python scripts/gen-og-banner.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "hero.jpg"
DST = ROOT / "docs" / "og-banner.png"

TARGET_W = 1280
TARGET_H = 640

INK_HEAVY = (28, 27, 25)
INK_MEDIUM = (74, 72, 66)
INK_LIGHT = (139, 136, 128)
CINNABAR = (184, 55, 47)

FONT_DIR = Path("C:/Windows/Fonts")
TITLE_FONT = FONT_DIR / "georgiab.ttf"
ITALIC_FONT = FONT_DIR / "georgiai.ttf"
BODY_FONT = FONT_DIR / "georgia.ttf"


def fit_cover(img: Image.Image, w: int, h: int) -> Image.Image:
    """Resize + center-crop to fill (w, h) while preserving aspect ratio."""
    src_w, src_h = img.size
    scale = max(w / src_w, h / src_h)
    new_w, new_h = int(src_w * scale), int(src_h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    x0 = (new_w - w) // 2
    y0 = (new_h - h) // 2
    return img.crop((x0, y0, x0 + w, y0 + h))


def main() -> None:
    DST.parent.mkdir(parents=True, exist_ok=True)

    base = Image.open(SRC).convert("RGB")
    canvas = fit_cover(base, TARGET_W, TARGET_H)

    # 左侧留白雾化: 在左侧叠一层淡米色幕布拉高对比,不破坏原图颜色
    veil = Image.new("RGBA", (int(TARGET_W * 0.5), TARGET_H), (250, 247, 239, 150))
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(veil, (0, 0))

    draw = ImageDraw.Draw(canvas)

    title_font = ImageFont.truetype(str(TITLE_FONT), 170)
    tagline_font = ImageFont.truetype(str(ITALIC_FONT), 34)
    caption_font = ImageFont.truetype(str(BODY_FONT), 20)
    seal_font = ImageFont.truetype(str(TITLE_FONT), 24)

    # 标题位置
    title_x, title_y = 96, 220
    draw.text((title_x, title_y), "NOUS", font=title_font, fill=INK_HEAVY)

    # 副标 italic
    draw.text((title_x + 6, title_y + 200), "Turn thoughts into action.", font=tagline_font, fill=INK_MEDIUM)

    # 细笔触分隔
    draw.rectangle((title_x + 6, title_y + 258, title_x + 72, title_y + 260), fill=INK_HEAVY)

    # 底注
    draw.text(
        (title_x + 6, title_y + 276),
        "The INTP way  ·  MIT · Self-hostable",
        font=caption_font,
        fill=INK_LIGHT,
    )

    # 朱砂印 (收尾款章, 放在 caption 右侧作为收印)
    seal_w, seal_h = 56, 56
    seal_x = title_x + 360
    seal_y = title_y + 258
    seal_layer = Image.new("RGBA", (seal_w, seal_h), (0, 0, 0, 0))
    seal_draw = ImageDraw.Draw(seal_layer)
    seal_draw.rounded_rectangle((0, 0, seal_w, seal_h), radius=3, fill=CINNABAR + (235,))
    seal_draw.text((14, 12), "思", font=seal_font, fill=(250, 247, 239))
    seal_layer = seal_layer.rotate(-8, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(seal_layer, (seal_x, seal_y))

    final = canvas.convert("RGB")
    final.save(DST, format="PNG", optimize=True)
    print(f"wrote {DST}  size={DST.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
