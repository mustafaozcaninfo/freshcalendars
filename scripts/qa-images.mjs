/** Wait for visible lazy images and their decoded pixels before capturing a page. */
export async function readyImages(page) {
  await page.evaluate(async () => {
    const images=[...document.images].filter(image=>{
      const rect=image.getBoundingClientRect();
      return rect.width>0&&rect.height>0&&rect.top<innerHeight&&rect.bottom>0;
    });
    for(const image of images)image.loading='eager';
    await Promise.race([
      Promise.all(images.map(image=>image.decode().catch(()=>{}))),
      new Promise(resolve=>setTimeout(resolve,6000)),
    ]);
    const broken=images.filter(image=>!image.complete||!image.naturalWidth);
    if(broken.length)throw Error('Visible screenshot images failed: '+broken.map(image=>image.currentSrc||image.src).join(', '));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
}
