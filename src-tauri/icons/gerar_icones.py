"""Gera os ícones do Print 360 (Aquino Consultoria)."""
from PIL import Image, ImageDraw
import io
import os
import struct

SAIDA = os.path.dirname(os.path.abspath(__file__))


def criar(tamanho):
    img = Image.new("RGBA", (tamanho, tamanho), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = tamanho / 512
    d.rounded_rectangle([0, 0, tamanho - 1, tamanho - 1], radius=int(110 * s), fill=(37, 99, 235, 255))
    d.rounded_rectangle([int(168 * s), int(116 * s), int(344 * s), int(250 * s)], radius=int(12 * s), fill=(255, 255, 255, 255))
    for y in (152, 182, 212):
        d.rounded_rectangle([int(194 * s), int(y * s), int(318 * s), int((y + 9) * s)], radius=int(4 * s), fill=(147, 197, 253, 255))
    d.rounded_rectangle([int(118 * s), int(250 * s), int(394 * s), int(386 * s)], radius=int(26 * s), fill=(255, 255, 255, 255))
    d.rounded_rectangle([int(150 * s), int(330 * s), int(362 * s), int(344 * s)], radius=int(7 * s), fill=(37, 99, 235, 255))
    d.rounded_rectangle([int(168 * s), int(386 * s), int(344 * s), int(408 * s)], radius=int(8 * s), fill=(255, 255, 255, 255))
    d.ellipse([int(342 * s), int(278 * s), int(366 * s), int(302 * s)], fill=(6, 182, 212, 255))
    return img


criar(512).save(os.path.join(SAIDA, "icon.png"))
criar(32).save(os.path.join(SAIDA, "32x32.png"))
criar(128).save(os.path.join(SAIDA, "128x128.png"))
criar(256).save(os.path.join(SAIDA, "128x128@2x.png"))
criar(256).save(os.path.join(SAIDA, "icon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

corpo = b""
for tipo, tamanho in (("ic11", 32), ("ic12", 64), ("ic07", 128), ("ic08", 256), ("ic09", 512)):
    buf = io.BytesIO()
    criar(tamanho).save(buf, format="PNG")
    dados = buf.getvalue()
    corpo += tipo.encode() + struct.pack(">I", 8 + len(dados)) + dados

icns = b"icns" + struct.pack(">I", 8 + len(corpo)) + corpo
with open(os.path.join(SAIDA, "icon.icns"), "wb") as arquivo:
    arquivo.write(icns)

print("Ícones gerados:", sorted(os.listdir(SAIDA)))
