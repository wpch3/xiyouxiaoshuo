import numpy as np
from PIL import Image
from scipy import ndimage
base=Image.open('art/xiaoxun/head/head_test_front.png').convert('RGB')
B=np.asarray(base).astype(np.float32)
S=Image.open('art/xiaoxun/head/eyes/eye_open_single.png').convert('RGB')
A=np.asarray(S).astype(np.float32)
m=A.max(axis=2)>30
m=ndimage.binary_fill_holes(ndimage.binary_closing(m,iterations=2))
ys,xs=np.where(m); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
crop=S.crop((x0,y0,x1+1,y1+1)); cm=Image.fromarray((m[y0:y1+1,x0:x1+1]*255).astype(np.uint8))
out=B.copy()
def inpaint(img, hole, iters=60):
    # normalized-convolution diffusion fill inside hole
    known=(~hole).astype(np.float32)
    f=img.copy()
    f[hole]=0
    w=known.copy()
    for _ in range(iters):
        num=np.stack([ndimage.gaussian_filter(f[...,c]*w,2) for c in range(3)],-1)
        den=ndimage.gaussian_filter(w,2)[...,None]+1e-6
        fill=num/den
        f=np.where(hole[...,None], fill, img)
        w=np.where(hole, np.clip(den[...,0],0,1), known)
    return f
def place(bx0,by0,bx1,by1,flip=False):
    global out
    pad=6
    H,W=out.shape[:2]
    hole=np.zeros((H,W),bool)
    hole[by0-pad:by1+pad, bx0-pad:bx1+pad]=True
    # hole only covers the old eye ellipse area
    yy,xx=np.mgrid[0:H,0:W]
    cx,cy=(bx0+bx1)/2,(by0+by1)/2; rx,ry=(bx1-bx0)/2+pad,(by1-by0)/2+pad
    hole=((xx-cx)/rx)**2+((yy-cy)/ry)**2<=1
    filled=inpaint(out,hole)
    hole_soft=ndimage.gaussian_filter(hole.astype(np.float32),2)
    out=filled*hole_soft[...,None]+out*(1-hole_soft[...,None])
    c=crop.transpose(Image.FLIP_LEFT_RIGHT) if flip else crop
    mm=cm.transpose(Image.FLIP_LEFT_RIGHT) if flip else cm
    w,h=bx1-bx0,by1-by0
    c=c.resize((w,h),Image.LANCZOS); mm=mm.resize((w,h),Image.LANCZOS)
    a=ndimage.gaussian_filter(np.asarray(mm).astype(np.float32)/255.0,0.6)
    reg=out[by0:by1,bx0:bx1]
    out[by0:by1,bx0:bx1]=reg*(1-a[...,None])+np.asarray(c).astype(np.float32)*a[...,None]
place(292,360,392,430,False)
place(486,360,586,430,True)
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save('art/xiaoxun/head/eyes/head_open_eyes_try.png')
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).crop((240,300,640,480)).resize((800,360)).save('/tmp/head_eye_crop2.png')
print('ok')
