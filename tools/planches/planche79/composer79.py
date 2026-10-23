import sys; sys.path.insert(0, '/tmp/claude-0/-home-user-Premier-Jeu/701efb59-3db6-5e50-a455-0116ad5698c0/scratchpad/s164/p77')
from composer import FB, FT, FS, FOND, OR, CREME, wrap
from PIL import Image, ImageDraw
D = '/tmp/claude-0/-home-user-Premier-Jeu/701efb59-3db6-5e50-a455-0116ad5698c0/scratchpad/s167/'
OUT = '/home/user/Premier-Jeu/docs/planches-v059/planche-79-ogre-et-pandas-renegats.png'
T = [('p79_1.png', '1. L’ogre du péage', "Plus un troll (les trolls sont un peuple du jeu) : un ogre de la rivière, deux fois et demie un homme. Six poses dessinées à la finesse des personnages : il garde le pont en respirant, lève sa massue, marche vraiment (deux images de pas, il ne glisse plus), mord la pièce, pleure à l’histoire."),
     ('og3_01.png', '2. Sous le petit pont', "« Sous le petit pont, un ogre se lève du ruisseau, une marmite cabossée sur la tête, et lève sa massue au-dessus du chemin. » Payé, il mord la pièce, puis s’écarte en marchant dans le ruisseau, et la maison passe le pont."),
     ('p79_3.png', '3. Les pandas renégats', "Des pandas de la Confrérie qui ont déserté après avoir été condamnés pour « propagation de complots sur le passé » : ils se souviennent de ce que le sort d’oubli cache. Leur vieux bleu de la Confrérie, une cape grise, un foulard sur le museau, l’insigne rayé d’un coup de couteau."),
     ('br2_01.png', '4. Sur la route', "« Trois pandas en capuche barrent la route, l’arc bandé. Sur leur poitrine, l’insigne de la Confrérie est rayé d’un coup de couteau. “Ta bourse, voyageur. Le Conseil ne nous paie plus depuis qu’on se souvient.” » Proposition : un 4e choix, « Leur demander pourquoi ils ont déserté ».")]
pad, tw, th, lg = 12, 954, 536, 100
L = 2 * tw + 3 * pad; H = 72 + 2 * (th + lg + pad) + pad
im = Image.new('RGB', (L, H), FOND); d = ImageDraw.Draw(im)
d.text((pad + 8, 18), 'Planche 79 — L’ogre du péage et les pandas renégats (à valider)', font=FB, fill=OR)
for k, (f, t, txt) in enumerate(T):
    x = pad + (k % 2) * (tw + pad); y = 72 + (k // 2) * (th + lg + pad)
    src = Image.open(D + f).convert('RGB').resize((tw, th), Image.LANCZOS); im.paste(src, (x, y))
    d.text((x + 4, y + th + 6), t, font=FT, fill=OR)
    for i, l in enumerate(wrap(d, txt, FS, tw - 8)[:3]): d.text((x + 4, y + th + 8 + FT.size + 4 + i * (FS.size + 4)), l, font=FS, fill=CREME)
im.save(OUT); print(OUT, im.size)
