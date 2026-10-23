import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-Premier-Jeu/701efb59-3db6-5e50-a455-0116ad5698c0/scratchpad/s164/p77')
from composer import FB, FT, FS, FOND, OR, CREME, wrap
from PIL import Image, ImageDraw, ImageFont
D = '/tmp/claude-0/-home-user-Premier-Jeu/701efb59-3db6-5e50-a455-0116ad5698c0/scratchpad/s165/'
OUT = '/home/user/Premier-Jeu/docs/planches-v059/planche-78-v2-vorhal-dum.png'
FL = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 22)
# l'avant / après : le trône seul, côte à côte
ap = Image.new('RGB', (1908, 1072), (10, 14, 18)); da = ImageDraw.Draw(ap)
for k, (f, t) in enumerate([('p78v1_1.png', 'avant : au bord du trône'), ('p78_1.png', 'maintenant : calé au fond')]):
    src = Image.open(D + f).convert('RGB').crop((560, 0, 1400, 1080)).resize((728, 936), Image.LANCZOS)
    x = 140 + k * 900; ap.paste(src, (x, 70))
    w = da.textlength(t, font=FL); da.rectangle((x + 364 - w / 2 - 12, 18, x + 364 + w / 2 + 12, 56), fill=(10, 14, 18)); da.text((x + 364 - w / 2, 22), t, font=FL, fill=(232, 200, 120) if k else (200, 200, 200))
ap.save(D + 'p78v2_avant_apres.png')
pad, L = 12, 1920 + 24
haut = ('p78_1.png', '1. Assis au fond de son trône', "Tout le haut du corps descend : les hanches sur le siège, les cuisses à plat, les genoux devant ; le dossier se dresse maintenant au-dessus de ses épaules, jusqu’à sa capuche, et ses coudes reposent sur les accoudoirs. La flamme de sa main est violette. Toujours dix hommes de haut.")
bas = [('p78v2_avant_apres.png', '2. Avant / maintenant', "Avant, on aurait dit qu’il se tenait au bord du siège, en gainage ; maintenant il est calé dans le trône, qui l’encadre."),
       ('p78v2_flamme.png', '3. La flamme de pouvoir, en violet', "Dessinée deux fois plus fin que lui, en quatre images qui bouclent : elle monte, ondule, se sépare en langues, avec un cœur presque blanc et des braises.")]
lg = 96
H = 72 + 1080 + lg + pad + 540 + lg + pad
im = Image.new('RGB', (L, H), FOND); d = ImageDraw.Draw(im)
d.text((pad + 8, 18), 'Planche 78 v2 — Vorhal’Düm calé dans son trône, la flamme violette (à valider)', font=FB, fill=OR)
def tuile(f, t, txt, x, y, w, h):
    src = Image.open(D + f).convert('RGB')
    if src.size != (w, h): src = src.resize((w, h), Image.LANCZOS)
    im.paste(src, (x, y)); d.text((x + 4, y + h + 6), t, font=FT, fill=OR)
    for i, l in enumerate(wrap(d, txt, FS, w - 8)[:3]): d.text((x + 4, y + h + 8 + FT.size + 4 + i * (FS.size + 4)), l, font=FS, fill=CREME)
tuile(*haut, pad, 72, 1920, 1080)
y2 = 72 + 1080 + lg + pad
for k, b in enumerate(bas): tuile(*b, pad + k * (954 + 12), y2, 954, 536)
im.save(OUT); print(OUT, im.size)
