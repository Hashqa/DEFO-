import sys, colorsys
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32)/255
H, W, _ = a.shape
r,g,b = a[...,0],a[...,1],a[...,2]
mx=a.max(-1); mn=a.min(-1); v=mx; s=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
# teinte
h=np.zeros_like(mx); d=np.maximum(mx-mn,1e-6)
h=np.where(mx==r, ((g-b)/d)%6, np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
brown=(h>5)&(h<45)&(v<0.5)&(s>0.25)
fg=~brown
# composantes connexes
lab=np.zeros((H,W),int); n=0; sizes=[]
for y in range(H):
  for x in range(W):
    if fg[y,x] and not lab[y,x]:
      n+=1; q=deque([(y,x)]); lab[y,x]=n; c=0
      while q:
        cy,cx=q.popleft(); c+=1
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
          ny,nx=cy+dy,cx+dx
          if 0<=ny<H and 0<=nx<W and fg[ny,nx] and not lab[ny,nx]: lab[ny,nx]=n; q.append((ny,nx))
      sizes.append(c)
sizes=np.array([0]+sizes)
keep=sizes[lab]>=35
# étincelles : petites composantes presque blanches
for k in range(1,n+1):
  if 35<=sizes[k]<160:
    m=lab==k
    if v[m].mean()>0.75 and s[m].mean()<0.3: keep[m]=False
segs=[(8,126),(128,246),(250,346),(348,441),(442,562),(563,641),(643,722),(724,842)]
alpha=(keep*255).astype(np.uint8)
A=Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
rgba=im.copy(); rgba.putalpha(A)
for i,(x0,x1) in enumerate(segs):
  sub=keep[:,x0:x1+1]; ys=np.where(sub.any(1))[0]; y0,y1=ys[0],ys[-1]
  if i==6: y0=y0+int((y1-y0)*.3)   # araignée : fil raccourci, symbole plus grand
  crop=rgba.crop((x0,y0,x1+1,y1+1)); w,hh=crop.size; S=int(max(w,hh)*1.08)
  if i==6:
    from PIL import ImageEnhance
    crop=ImageEnhance.Brightness(crop).enhance(1.25)
  sq=Image.new('RGBA',(S,S),(0,0,0,0)); sq.paste(crop,((S-w)//2,(S-hh)//2),crop)
  big=sq.resize((320,320),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4,percent=60,threshold=2))
  big.save(f'{out}/{i}.png')
