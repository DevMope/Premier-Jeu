import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-Premier-Jeu/701efb59-3db6-5e50-a455-0116ad5698c0/scratchpad/s164/p77')
from composer import FB, FT, FS, FOND, OR, CREME, wrap
from PIL import Image, ImageDraw
D = '/tmp/claude-0/-home-user-Premier-Jeu/701efb59-3db6-5e50-a455-0116ad5698c0/scratchpad/s165/'
OUT = '/home/user/Premier-Jeu/docs/planches-v059/planche-78-vorhal-dum.png'
pad, L = 12, 1920 + 24
haut = [('p78_1.png', '1. Sur son trône, à l’échelle', "Assis sur un trône de pierre sculptée, il fait dix hommes de haut (un Ouvre-Route à ses pieds). Capuche haute et vide, col hérissé d’épines, longues robes qui tombent jusqu’aux marches. Sa main droite serre un bâton noueux coiffé d’un crâne de bête ; la gauche, levée, tient une flamme froide. Derrière sa tête, la lueur tourne.")]
bas = [('p78_2.png', '2. Les détails', "Sous la capuche, le néant : aucun visage, aucune bouche (il parle dans la tête). Le crâne au sommet du bâton. La couleur de sa magie : A bleu-blanc comme ton image, ou B violet, la couleur de l’Engeance ?"),
       ('p78_3.png', '3. Dans le jeu : derrière le Voile', "La salle de la Porte (validée) ne change pas : à travers le voile, on le devine, immense, assis de l’autre côté. Il remplace l’ancien Vorhal’Düm (six cornes, six yeux).")]
lg = 96
H = 72 + 1080 + lg + pad + 540 + lg + pad
im = Image.new('RGB', (L, H), FOND); d = ImageDraw.Draw(im)
d.text((pad + 8, 18), 'Planche 78 — Vorhal’Düm l’Affamé, le chef de l’Engeance et le père de Vhaldrak (nouveau design, à valider)', font=FB, fill=OR)
def tuile(f, t, txt, x, y, w, h):
    src = Image.open(D + f).convert('RGB')
    if src.size != (w, h): src = src.resize((w, h), Image.LANCZOS)
    im.paste(src, (x, y)); d.text((x + 4, y + h + 6), t, font=FT, fill=OR)
    for i, l in enumerate(wrap(d, txt, FS, w - 8)[:3]): d.text((x + 4, y + h + 8 + FT.size + 4 + i * (FS.size + 4)), l, font=FS, fill=CREME)
tuile(*haut[0], pad, 72, 1920, 1080)
y2 = 72 + 1080 + lg + pad
for k, b in enumerate(bas): tuile(*b, pad + k * (954 + 12), y2, 954, 536)
im.save(OUT); print(OUT, im.size)
