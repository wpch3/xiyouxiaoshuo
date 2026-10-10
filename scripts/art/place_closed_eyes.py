import numpy as np
from PIL import Image
from scipy import ndimage
B=np.asarray(Image.open('/home/user/xiyouxiaoshuo/art/xiaoxun/head/head_test_front.png').convert('RGB')).astype(np.float32)
H,W=B.shape[:2]
def inpaint(img, hole, iters=60):
    known=(~hole).astype(np.float32); f=img.copy(); f[hole]=0; w=known.copy()
    for _ in range(iters):
        num=np.stack([ndimage.gaussian_filter(f[...,c]*w,2) for c in range(3)],-1)
        den=ndimage.gaussian_filter(w,2)[...,None]+1e-6
        fill=num/den
        f=np.where(hole[...,None],fill,img)
        w=np.where(hole,np.clip(den[...,0],0,1),known)
    return f
yy,xx=np.mgrid[0:H,0:W]
hole=np.zeros((H,W),bool)
for bx0,by0,bx1,by1 in [(292,360,392,430),(486,360,586,430)]:
    cx,cy=(bx0+bx1)/2,(by0+by1)/2; rx,ry=(bx1-bx0)/2+6,(by1-by0)/2+6
    hole|=((xx-cx)/rx)**2+((yy-cy)/ry)**2<=1
filled=inpaint(B,hole)
hs=ndimage.gaussian_filter(hole.astype(np.float32),2)[...,None]
base2=filled*hs+B*(1-hs)
L=np.asarray(Image.open('/home/user/xiyouxiaoshuo/art/xiaoxun/head/parts/eyes_closed_tight.png').convert('RGBA')).astype(np.float32)
a=L[...,3:4]/255.0
out=base2*(1-a)+L[...,:3]*a
out=np.clip(out,0,255).astype(np.uint8)
Image.fromarray(out).save('/home/user/xiyouxiaoshuo/art/xiaoxun/head/eyes/head_closed_eyes_try.png')
Image.fromarray(out).crop((240,300,640,480)).resize((800,360)).save('/tmp/closed_crop.png')
print('ok')
