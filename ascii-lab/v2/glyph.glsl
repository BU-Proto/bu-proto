#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform sampler2D uPic; uniform vec2 uRes; uniform float uCell, uT, uHarbor;
  const vec3 FROST=vec3(.965,.984,1.), SKY=vec3(.486,.780,.957), LAGOON=vec3(.247,.722,.816), CREAM=vec3(1.,.965,.875);
  float h(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.45); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  float lum(vec3 c){ return dot(c,vec3(.2126,.7152,.0722)); }
  float line(vec2 p,vec2 a,vec2 b,float w,float px){ vec2 pa=p-a,ba=b-a; float k=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return 1.-smoothstep(w-px,w+px,length(pa-ba*k)); }
  float diamond(vec2 p,float r,float px){ return 1.-smoothstep(r-px,r+px,abs(p.x)+abs(p.y)); }
  /* the alphabet, drawn with segments in a -.5 to .5 cell */
  float glyph(int k,vec2 q,float px){
    float w=.075;
    if(k==1) return line(q,vec2(0,-.34),vec2(0,.34),w*.8,px);
    if(k==2) return line(q,vec2(-.32,-.5),vec2(.32,.5),w,px);
    if(k==3) return max(line(q,vec2(-.5,-.5),vec2(.06,.5),w,px),line(q,vec2(-.06,-.5),vec2(.5,.5),w,px));
    if(k==4) return max(line(q,vec2(0,-.44),vec2(0,.44),w*1.3,px),line(q,vec2(-.44,0),vec2(.44,0),w*1.3,px));
    if(k==5) return max(line(q,vec2(0,-.5),vec2(0,.5),w*1.4,px),line(q,vec2(-.34,.16),vec2(.34,.16),w*1.4,px));
    if(k==6) return diamond(q,.36,px)-diamond(q,.2,px);
    if(k==7) return diamond(q,.34,px);
    if(k==8) return 1.-smoothstep(.1-px,.1+px,length(q));
    if(k==9) return max(line(q,vec2(-.2,-.5),vec2(-.2,.5),w,px),line(q,vec2(.2,-.5),vec2(.2,.5),w,px));
    if(k==10) return 1.-smoothstep(.44-px,.44+px,max(abs(q.x),abs(q.y)));
    if(k==11) return 1.-smoothstep(.2-px,.2+px,abs(q.x));
    return 0.;
  }
  void main(){
    vec2 px=vec2(vUv.x,1.-vUv.y)*uRes;
    vec2 id=floor(px/uCell), f=fract(px/uCell)-.5;
    vec2 cuv=(id+.5)*uCell/uRes; cuv.y=1.-cuv.y;
    vec4 cs=texture(uPic,cuv);
    vec3 base=textureLod(uPic,vUv,.8).rgb;
    /* a fine tile inside each cell puts the picture on the same grid as the type */
    vec2 sub=(floor(px/(uCell/4.))+.5)*(uCell/4.)/uRes; sub.y=1.-sub.y;
    base=mix(base,texture(uPic,sub).rgb,.42);
    float L=lum(cs.rgb), rim=cs.a;
    /* marks run in columns, which gives the vertical grain */
    float run=floor((id.y+h(vec2(id.x,4.))*9.)/(2.+floor(h(vec2(id.x,7.))*5.)));
    float n=h(vec2(id.x,run)), n2=h(id+.5);
    if(L<.42) n=n2;
    float cl=vn(id*.13+vec2(uT*.03,0.))*.65+vn(id*.41+7.)*.35;
    float tw=fract(n2*7.+uT*.1*(.4+n));
    int k=0; float a=1.; vec3 ink=FROST;
    vec3 lift=mix(cs.rgb*1.3+.08,FROST,smoothstep(.62,.95,L));
    if(rim>.3){
      ink=mix(LAGOON,SKY,.55)+.2; k=n2>.5?7:(n2>.25?4:(n2>.1?2:6)); a=.9;
      if(rim>.72&&n2>.86){ ink=FROST; k=11; }
    } else if(L<.26){
      ink=cs.rgb*(uHarbor>.5?1.9:.3)+.01;
      k=n>.72?1:(n>.6?8:0); a=.62;
    } else if(L<.42){
      ink=uHarbor>.5?lift:cs.rgb*.5;
      k=n>.76?1:(n>.68?6:(n>.6?2:0)); a=.6;
    } else if(L<.58){
      ink=mix(cs.rgb*1.5+.05,FROST,.12);
      k=n>.76?7:(n>.66?2:(n>.58?4:(n>.5?6:0))); a=.8;
    } else if(L<.72){
      ink=lift;
      k=n>.7?2:(n>.48?7:(n>.3?5:(n>.16?6:0))); a=.86;
      if(cl>.62&&n2>.84){ k=11; ink=FROST; a=.95; }
    } else {
      /* the bright pass: two inks, one above the tone and one below */
      bool dusk=n2<.5&&L<.9;
      ink=dusk?mix(cs.rgb,vec3(.58,.3,.28),.55):mix(CREAM,FROST,.6);
      k=n>.68?3:(n>.42?5:(n>.26?2:(n>.12?7:4))); a=dusk?.78:.96;
      if(cl>.56&&n2>.72){ k=n2>.92?10:11; ink=FROST; a=1.; }
    }
    if(tw>.97&&L>.4){ k=n2>.5?7:5; ink=FROST; a=1.; }
    float pxs=1.05/uCell;
    float g=clamp(glyph(k,f,pxs),0.,1.);
    vec3 col=mix(base,ink,g*a);
    /* a little light spills from the rim into the picture around it */
    col+=textureLod(uPic,vUv,3.).a*vec3(.2,.4,.45)*.5;
    vec2 e=abs(vUv-.5)*2.; col*=1.-.32*smoothstep(.97,1.,max(e.x,e.y));
    o=vec4(col,1.);
  }
