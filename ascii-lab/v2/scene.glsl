#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform float uT, uAspect, uHarbor; uniform vec2 uLight;
  const vec3 HARBOR=vec3(.024,.102,.180), RAISED=vec3(.071,.227,.361), FROST=vec3(.965,.984,1.),
    LAGOON=vec3(.247,.722,.816), SKY=vec3(.486,.780,.957), IRIS=vec3(.714,.667,1.), DEEP=vec3(.478,.431,.878),
    ROSE=vec3(.957,.635,.753), RASP=vec3(.761,.251,.478), PEACH=vec3(.973,.573,.541), GOLD=vec3(1.,.827,.541);
  float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<4;i++){ v+=a*vn(p); p=p*2.03+vec2(7.1,3.7); a*=.5; } return v/.9375; }
  float seg(vec2 p,vec2 a,vec2 b,out float h){ vec2 pa=p-a,ba=b-a; h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h); }
  float smax(float a,float b,float k){ float h=max(k-abs(a-b),0.)/k; return max(a,b)+h*h*k*.25; }
  vec3 over(vec3 a,vec3 b,float t){ return mix(a,b,clamp(t,0.,1.)); }

  vec3 ground(vec2 p,float t){
    float n=fbm(p*.75+vec2(t*.012,-t*.009));
    if(uHarbor>.5){
      vec3 g=mix(HARBOR,RAISED,smoothstep(.25,.85,n)*.8);
      g=over(g,RASP*.5,exp(-dot(p-vec2(1.1,-.75),p-vec2(1.1,-.75))*.8)*.65);
      g=over(g,DEEP*.42,exp(-dot(p-vec2(1.1,.8),p-vec2(1.1,.8))*.9)*.6);
      return g;
    }
    vec3 cream=mix(mix(FROST,GOLD,.3),PEACH,.12), peach=mix(mix(PEACH,GOLD,.46),FROST,.3), dusk=mix(ROSE,RASP,.34)*.86;
    vec3 g=mix(peach,cream,smoothstep(-.7,1.1,p.x*.5+p.y*.85+(n-.5)*.7));
    g=over(g,dusk,smoothstep(.95,2.1,p.x*.72-p.y*.8)*.88);
    g=over(g,mix(FROST,GOLD,.12),exp(-dot(p-vec2(1.05,.72),p-vec2(1.05,.72))*2.4)*.55);
    g=over(g,mix(GOLD,PEACH,.45)*.92,exp(-dot(p-vec2(-.55,-.8),p-vec2(-.55,-.8))*2.6)*.62);
    return g;
  }

  void main(){
    vec2 p=(vUv*2.-1.)*vec2(uAspect,1.); float t=uT;
    p*=min(3.4,max(1.,1.5/uAspect));
    p+=.006*vec2(sin(p.y*1.7+t*.21),sin(p.x*1.4+t*.17));
    vec3 col=ground(p,t); float rimFlag=0.;

    /* out-of-focus points of light low in the frame */
    for(int i=0;i<18;i++){
      float fi=float(i), s=h21(vec2(fi,3.1));
      vec2 c=vec2(-1.1+h21(vec2(fi,9.))*1.25,-1.02+h21(vec2(fi,5.))*.72)+.01*vec2(sin(t*.3+fi),cos(t*.23+fi*2.));
      float r=.02+.05*s;
      col=over(col,mix(GOLD,FROST,.3+.4*s),smoothstep(r,r*.3,length(p-c))*(.3+.5*s)*(uHarbor>.5?.5:1.));
    }

    /* the bank, dark and far out of focus */
    float bd=length((p-vec2(-1.78,-1.08))*vec2(1.,.96))-.97+.16*(fbm(p*2.4)-.5);
    float ba=smoothstep(.2,-.1,bd);
    if(ba>0.){
      float mo=fbm(p*3.2+2.);
      vec3 mc=mix(HARBOR*.3,DEEP*.34+RASP*.2,smoothstep(.4,.62,mo));
      mc=over(mc,HARBOR*.22,smoothstep(.48,.72,fbm(p*2.6+3.))*.8);
      mc=over(mc,PEACH*.45,smoothstep(.66,.8,fbm(p*5.+9.))*.55*smoothstep(-.25,.05,bd));
      col=over(col,mc,ba);
    }

    const vec2 C=vec2(-.075,.095), D=vec2(.914,-.406), N=vec2(.406,.914), HUB=vec2(-.47,.05);
    vec2 r=p-C; float u=dot(r,D), v=dot(r,N);
    float ang=atan(v,u);
    float lobe=1.+.014*sin(ang*4.+1.2)+.009*sin(ang*9.+t*.04);
    float cs=(length(vec2(u/1.44,v/.67))/lobe-1.)*.67;
    float bh; float bite=seg(p,vec2(-1.62,-.05),vec2(-.6,-.7),bh)-.6;
    float sd=smax(cs,-bite,.14);

    /* the stem sits behind the cap, and dissolves into the gills at the hub */
    float s1,s2; vec2 SM=vec2(-.93,-.07), SE=vec2(-1.75,-.3);
    float d1=seg(p,HUB,SM,s1), d2=seg(p,SM,SE,s2);
    float s=d1<d2?s1*.5:.5+s2*.5, d=min(d1,d2);
    float w=.135+.26*exp(-s*5.5);
    float stem=smoothstep(w+.05,w-.07,d);

    float cap=smoothstep(.016,-.016,sd);
    /* a pale halo of scattered light just outside the edge */
    float hal=exp(-max(sd,0.)/.07)*(1.-cap);
    col=over(col,mix(FROST,mix(SKY,IRIS,.4),.35),hal*.62);

    if(stem>0.){
      vec2 dir=normalize(SE-HUB), nor=vec2(-dir.y,dir.x);
      float side=dot(p-mix(HUB,SE,s),nor)/max(w,.01);
      vec3 sc=mix(RASP*.4+DEEP*.08,RASP*.32+DEEP*.44,smoothstep(.1,.8,s));
      sc=mix(sc,mix(IRIS,DEEP,.5),smoothstep(.55,1.,abs(side))*.75);
      sc=over(sc,mix(ROSE,FROST,.35),smoothstep(.8,1.12,side)*.75);
      sc=over(sc,mix(FROST,ROSE,.3),smoothstep(-.8,-1.12,side)*.6);
      sc*=.9+.2*fbm(vec2(s*9.,side*2.));
      col=over(col,sc,stem);
    }

    if(cap>0.){
      vec2 hv=p-HUB; float hu=dot(hv,D), hw=dot(hv,N);
      float rr=length(vec2(hu/1.75,hw/.86));
      float th=atan(hw,hu*.62)+.22*rr*sin(rr*2.1+.6);
      float wob=fbm(vec2(th*1.7,rr*1.8)+t*.008);
      float rib=.5+.5*sin(th*30.+wob*5.5);
      float fine=.5+.5*sin(th*71.+wob*7.);
      float ribs=pow(rib,1.4)*.68+fine*.32;
      float edge=smoothstep(-.2,-.015,sd);
      float lit=smoothstep(-.95,.75,hu*.5-hw*.95);
      float x=.06+smoothstep(.1,1.,rr)*.34+lit*.32+(ribs-.5)*.34*smoothstep(.1,.42,rr);
      vec3 gc=mix(RASP*.3+DEEP*.05,RASP*.56+DEEP*.07,smoothstep(.12,.42,x));
      gc=mix(gc,mix(RASP,DEEP,.32)*.84,smoothstep(.38,.62,x));
      gc=mix(gc,mix(ROSE,IRIS,.42),smoothstep(.56,.82,x));
      gc=mix(gc,mix(RASP,ROSE,.55)*.95+(ribs-.5)*.12,smoothstep(-.46,-.2,sd)*.82);
      gc=mix(gc,mix(ROSE,IRIS,.34),smoothstep(-.28,-.12,sd)*.86);
      gc=mix(gc,mix(ROSE,FROST,.62),edge*.9);
      gc=mix(gc,mix(FROST,GOLD,.16),smoothstep(-.14,-.02,sd)*smoothstep(.1,.55,lit));

      /* the outer skin, narrow and mottled, above the line */
      float k=clamp(u/1.44,-1.,1.);
      float vs=.385*(1.-k*k)+.012*sin(u*2.7+t*.08);
      float above=smoothstep(-.012,.012,v-vs);
      float mott=fbm(vec2(u*2.3+5.,v*5.)+vec2(t*.008,0.));
      vec3 tc=mix(RASP*.32+DEEP*.42,DEEP*.98,smoothstep(.32,.68,mott));
      tc=mix(tc,mix(IRIS,ROSE,.22),smoothstep(.56,.84,mott)*.75);
      tc=mix(tc,mix(FROST,IRIS,.5),smoothstep(-.15,-.03,sd)*.9);
      gc*=1.-.42*exp(-pow((v-vs)/.11,2.))*(1.-above);
      vec3 cc=mix(gc,tc,above);

      float line=exp(-pow((v-vs)/.013,2.))*smoothstep(1.,.74,abs(k));
      float mod_=smoothstep(.3,.68,vn(vec2(u*3.+t*.04,1.7)));
      vec3 cyan=mix(LAGOON,SKY,.5)+.16;
      cc=over(cc,cyan,line*mod_*.8);
      col=over(col,cc,cap);

      /* the lit margin: cyan inside, frost at the very edge */
      float band=exp(-pow((sd+.03)/.017,2.))*cap;
      float pick=smoothstep(.3,.62,fbm(vec2(ang*2.2,1.)));
      col=over(col,cyan,band*pick*.72);
      col=over(col,mix(FROST,IRIS,.12),exp(-pow((sd+.008)/.014,2.))*cap*.9);
      rimFlag=max(line*mod_,band*pick);
    }

    float pl=exp(-dot(p-uLight,p-uLight)*3.4);
    col+=mix(ROSE,FROST,.45)*pl*.14;
    o=vec4(clamp(col,0.,.96),rimFlag);
  }
