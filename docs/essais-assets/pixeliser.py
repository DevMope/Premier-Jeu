# Transforme les particules lisses de Kenney (CC0) en petites images en pixel art, à notre palette
from PIL import Image
import sys, os
SRC='assets/2d-assets/effects'
OUT='demofx'
def intens(path):
    im=Image.open(path).convert('RGBA')
    # intensité = luminance × alpha
    r,g,b,a=im.split()
    l=Image.merge('RGB',(r,g,b)).convert('L')
    from PIL import ImageChops
    return ImageChops.multiply(l,a), im.size
def pix(path, w, h, ramp, alphas, seuil=0.12, nom=None, ombre_bas=False):
    I,(W,H)=intens(path)
    bbox=I.point(lambda v:255 if v>20 else 0).getbbox() or (0,0,W,H)
    I=I.crop(bbox)
    I=I.resize((w,h),Image.LANCZOS)
    out=Image.new('RGBA',(w,h),(0,0,0,0)); px=out.load(); src=I.load()
    n=len(ramp)
    for y in range(h):
        for x in range(w):
            v=src[x,y]/255
            if v<seuil: continue
            # tramage ordonné 2×2 : des paliers francs, comme le reste du jeu
            d=[[0,2],[3,1]][y%2][x%2]/4-0.375
            k=int(min(n-1,max(0,(v+d*0.18)*n)))
            c=ramp[k]; a=alphas[min(len(alphas)-1,k)]
            px[x,y]=((c>>16)&255,(c>>8)&255,c&255,int(a*255))
    out.save(os.path.join(OUT,nom))
FEU=[0x7a1206,0xc23a0e,0xee7a1c,0xffbf3c,0xfff2a8]
FUMEE=[0x3a3640,0x5a5660,0x7c7a84,0xa4a2aa,0xcac8ce]
EAU=[0x1a5a7a,0x2a8ab0,0x5ab8d8,0xa8e4f4,0xf0fcff]
P=SRC+'/particle-pack/PNG (Transparent)/'
for i in range(1,7): pix(P+f'flame_0{i}.png',10,16,FEU,[0.9,1,1,1,1],0.14,f'flamme{i}.png')
for i in range(1,3): pix(P+f'fire_0{i}.png',16,16,FEU,[0.85,1,1,1,1],0.14,f'feu{i}.png')
S=SRC+'/smoke-particles/PNG/White puff/'
for i in range(8): pix(S+f'whitePuff{i:02d}.png',18,18,FUMEE,[0.35,0.5,0.6,0.7,0.75],0.1,f'fumee{i}.png')
for i in range(1,5): pix(P+f'trace_0{i}.png',4,12,EAU,[0.8,0.9,1,1,1],0.15,f'jet{i}.png')
pix(P+'circle_05.png',4,4,EAU,[1,1,1,1,1],0.3,'goutte.png')
pix(P+'circle_02.png',24,8,EAU,[0.5,0.7,0.9,1,1],0.15,'rond.png')
pix(P+'spark_05.png',8,8,[0xffd060,0xffe890,0xfffbe0,0xffffff,0xffffff],[0.6,0.8,1,1,1],0.15,'etincelle.png')
print('ok', len(os.listdir(OUT)))
