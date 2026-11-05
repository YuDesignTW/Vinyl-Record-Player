// Shared deterministic vinyl artwork for the WebGL stage and collection preview.
export function vinylArtwork(record) {
 const color=record.vinylColor||'#171719',pattern=record.vinylPattern||'solid',clear=record.vinylFinish==='transparent';
 if(color==='#171719'&&pattern==='solid'&&!clear)return '/assets/vinyl.png';
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
 const c=canvas.getContext('2d');if(!c)return '/assets/vinyl.png';
 c.save();c.beginPath();c.arc(512,512,508,0,Math.PI*2);c.clip();
 c.globalAlpha=clear?.28:1;c.fillStyle=color;c.fillRect(0,0,1024,1024);c.globalAlpha=clear?.48:.72;
 c.strokeStyle=record.vinylAccent||'#f5e9d1';c.fillStyle=c.strokeStyle;
 let seed=47;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 if(pattern==='marble')for(let i=0;i<32;i++){c.beginPath();c.lineWidth=3+random()*22;const y=random()*1200-100;c.moveTo(-100,y);c.bezierCurveTo(200,y-250+random()*500,700,y-250+random()*500,1124,y+random()*250);c.stroke();}
 if(pattern==='splatter')for(let i=0;i<240;i++){const angle=random()*Math.PI*2,r=150+random()*350;c.beginPath();c.ellipse(512+Math.cos(angle)*r,512+Math.sin(angle)*r,2+random()*22,1+random()*8,angle,0,Math.PI*2);c.fill();}
 if(pattern==='split'){c.beginPath();c.arc(512,512,508,-Math.PI/2,Math.PI/2);c.lineTo(512,512);c.fill();}
 c.globalAlpha=1;
 for(let r=180;r<507;r+=2.4){c.beginPath();c.arc(512,512,r,0,Math.PI*2);c.strokeStyle=r%5<2.5?'rgba(0,0,0,.16)':'rgba(255,255,255,.23)';c.lineWidth=.75;c.stroke();}
 const shine=c.createConicGradient(.2,512,512);shine.addColorStop(0,'#ffffff00');shine.addColorStop(.13,'#ffffff55');shine.addColorStop(.26,'#00000018');shine.addColorStop(.5,'#ffffff00');shine.addColorStop(.63,'#ffffff50');shine.addColorStop(.76,'#00000018');shine.addColorStop(1,'#ffffff00');c.fillStyle=shine;c.fillRect(0,0,1024,1024);
 c.strokeStyle=clear?'#c3cbd988':'#00000055';c.lineWidth=4;c.beginPath();c.arc(512,512,506,0,Math.PI*2);c.stroke();c.restore();
 return canvas.toDataURL('image/png');
}
