const resume = window.RESUME_DATA;

    const $=(s,c=document)=>c.querySelector(s),el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n};
    const themedScenes={section:{highlights:[{cls:"scene-word",text:"02:48",x:"5%",y:"14%"},{cls:"scene-word",text:"★",x:"90%",y:"18%"},{cls:"scene-word",text:"WIN",x:"8%",y:"78%"}],skills:[{cls:"scene-code",text:"</>",x:"6%",y:"16%"},{cls:"scene-word",text:"AI",x:"88%",y:"18%"},{cls:"scene-phonetic",text:"/ə/",x:"90%",y:"75%"}],education:[{cls:"scene-word",text:"BOOK",x:"5%",y:"17%"},{cls:"scene-word",text:"✦",x:"91%",y:"22%"},{cls:"scene-code",text:"2026",x:"83%",y:"77%"}]},card:{"experience-practice":[{cls:"scene-building",x:"77%",y:"18%"},{cls:"scene-book",x:"68%",y:"65%"},{cls:"scene-notebook",x:"88%",y:"50%"},{cls:"scene-word",text:"HELLO",x:"69%",y:"10%"}],"experience-campus":[{cls:"scene-flagpole",x:"82%",y:"8%"},{cls:"scene-ceremonial-rifle",x:"67%",y:"63%"},{cls:"scene-ceremonial-rifle",x:"77%",y:"77%"},{cls:"scene-word",text:"HONOR",x:"66%",y:"27%"}],"project-ai":[{cls:"scene-word",text:"AI",x:"84%",y:"10%"},{cls:"scene-code",text:"0101",x:"72%",y:"74%"},{cls:"scene-word",text:"✦",x:"10%",y:"78%"}],"project-experiment":[{cls:"scene-flag",text:"⚗",x:"84%",y:"10%"},{cls:"scene-word",text:"Δ",x:"74%",y:"70%"}],"project-training":[{cls:"scene-flag",text:"⚑",x:"84%",y:"12%"},{cls:"scene-marcher",x:"71%",y:"31%"},{cls:"scene-word",text:"SYNC",x:"67%",y:"76%"}],"project-sport":[]}};
    themedScenes.paper={
      highlights:[{cls:"scene-basketball",x:"88%",y:"72%"},{cls:"scene-shoe",text:"👟",x:"5%",y:"77%"},{cls:"scene-track",x:"77%",y:"12%"},{cls:"scene-word",text:"GO",x:"8%",y:"16%"}],
      experience:[],
      projects:[{cls:"scene-word",text:"AI",x:"88%",y:"11%"},{cls:"scene-code",text:"0101",x:"7%",y:"78%"},{cls:"scene-flag",text:"⚗",x:"86%",y:"76%"}],
      skills:[{cls:"scene-code",text:"</>",x:"7%",y:"13%"},{cls:"scene-word",text:"AI",x:"88%",y:"74%"},{cls:"scene-phonetic",text:"/ə/",x:"89%",y:"12%"}],
      education:[{cls:"scene-building",x:"76%",y:"16%"},{cls:"scene-book",x:"8%",y:"77%"},{cls:"scene-notebook",x:"87%",y:"66%"},{cls:"scene-word",text:"★",x:"7%",y:"17%"}]
    };
    function addScene(target,objects,layerClass){if(!target||!objects||target.querySelector(`.${layerClass}`))return;const layer=el("div",layerClass);layer.setAttribute("aria-hidden","true");objects.forEach((item,index)=>{const object=el("span",`scene-object ${item.cls||""} s${index%3+1}`,item.text);object.style.setProperty("--x",item.x);object.style.setProperty("--y",item.y);layer.append(object)});target.prepend(layer)}
    function addCardScene(card,key){addScene(card,themedScenes.card[key],"scene-layer")}
    function initSectionScenes(){Object.entries(themedScenes.section).forEach(([id,objects])=>addScene($("#"+id),objects,"section-scene"))}
    function initPaperScenes(){document.querySelectorAll(".section .paper").forEach(paper=>{const section=paper.closest(".section");addScene(paper,themedScenes.paper[section?.id],"scene-layer")})}
    function toast(x){const n=$("#toast");n.textContent=x;n.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>n.classList.remove("show"),1600)}
    function hero(){
      const r=$("#hero"),p=resume.person,layout=el("div","profile-layout"),copy=el("div","profile-copy"),portrait=el("figure","avatar-showcase");
      copy.append(el("p","motto-label","AI SIGNAL PROFILE · 2026"));
      const h=el("h1","motto");
      h.append(document.createTextNode("Let whatever happens"),el("span","",", happen"));
      copy.append(h);
      const card=el("section","identity-card");
      card.setAttribute("aria-label","个人与教育信息");
      const head=el("div","identity-head"),left=el("div");
      left.append(el("h2","identity-name",p.name),el("p","identity-role",p.role));
      head.append(left,el("span","identity-state",p.status));
      card.append(head);
      const schools=el("div","school-list");
      resume.schools.forEach(s=>{
        const row=el("div","school-row"),name=el("div","school-name",s.name);
        if(s.degree)name.append(el("small","",` · ${s.degree}`));
        row.append(el("span","school-type",s.type),name,el("span","school-date",`${s.start} — ${s.end}`));
        schools.append(row);
      });
      card.append(schools);
      copy.append(card,el("p","summary",p.summary));
      const b=el("div","badges");
      resume.keywords.forEach(x=>b.append(el("span","badge",x)));
      copy.append(b);
      const c=el("div","contacts"),qq=el("button","contact primary",`QQ：${p.qq}`);
      qq.type="button";
      qq.onclick=async()=>{try{await navigator.clipboard.writeText(p.qq);toast("QQ 号码已复制")}catch{toast(`QQ：${p.qq}`)}};
      c.append(qq,el("span","contact",`${p.location} · ${p.age} 岁`),el("a","contact","查看 AI 学习路径 ↘"));
      c.lastElementChild.href="#aiPath";
      copy.append(c);
      const halo=el("div","avatar-halo"),avatarCard=el("div","avatar-card"),image=el("img"),fallback=el("div","avatar-fallback","FRC");
      image.src="assets/images/profile.jpg";
      image.alt="冯若辰的个人照片";
      image.loading="eager";
      image.decoding="async";
      image.onerror=()=>{image.style.display="none";fallback.style.display="grid"};
      avatarCard.append(image,fallback);
      portrait.append(halo,avatarCard,el("figcaption","avatar-nameplate","冯若辰 · FRC"),el("span","avatar-caption","LEARNING IN PUBLIC"));
      layout.append(copy,portrait);
      r.append(layout);
    }
    function highlights(){const r=$("#highlightGrid");resume.highlights.forEach(x=>{const a=el("article","metric");a.append(el("b","",x.value),el("strong","",x.label),el("p","",x.text));r.append(a)})}

    function aiPath(){
      const grid=$("#aiPathGrid"),filter=$("#aiFilter");
      const categories=[
        {id:"all",label:"全部路径"},
        {id:"content",label:"内容生成"},
        {id:"agent",label:"智能体 / RAG"},
        {id:"engineering",label:"开发工具"},
        {id:"vision",label:"视觉 AI"},
      ];

      function render(category="all"){
        grid.replaceChildren();
        resume.certificates.forEach((certificate,index)=>{
          const button=el("button","ai-node");
          button.type="button";
          button.dataset.category=certificate.categoryId;
          button.style.setProperty("--node-index",index);
          button.hidden=category!=="all"&&certificate.categoryId!==category;
          button.setAttribute("aria-label",`查看认证：${certificate.title}`);
          const top=el("span","ai-node-top"),order=el("b","ai-node-order",certificate.order),categoryLabel=el("span","ai-node-category",certificate.category);
          top.append(order,categoryLabel);
          button.append(top,el("strong","ai-node-title",certificate.shortTitle),el("p","ai-node-summary",certificate.summary),el("span","ai-node-action","VIEW EVIDENCE ↗"));
          button.onclick=()=>openCertificateLightbox(resume.certificates,index);
          grid.append(button);
        });
      }

      categories.forEach((category,index)=>{
        const button=el("button","ai-filter-button",category.label);
        button.type="button";
        button.dataset.category=category.id;
        button.setAttribute("aria-pressed",String(index===0));
        button.onclick=()=>{
          filter.querySelectorAll("button").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
          render(category.id);
        };
        filter.append(button);
      });
      render();
    }
    function bullets(arr){const u=el("ul","bullets");arr.forEach(x=>u.append(el("li","",x)));return u}
    function sportStage(){const stage=el("aside","sport-stage");stage.setAttribute("aria-label","篮球架、跑道与冰袋运动主题装饰");const hoop=el("div","sport-hoop"),board=el("i","sport-board"),rim=el("i","sport-rim"),pole=el("i","sport-pole"),track=el("i","sport-track-large"),ice=el("i","sport-icepack");hoop.append(board,rim,pole);stage.append(hoop,track,ice);return stage}
    function honorGuardStage(){const stage=el("aside","honor-guard-stage");stage.setAttribute("aria-label","仪仗队方队行走动画");const squad=el("div","guard-squad");for(let row=0;row<3;row++){for(let col=0;col<4;col++){const person=el("i","guard-person");person.style.setProperty("--x",`${col*58+row*10}px`);person.style.setProperty("--y",`${row*38}px`);person.style.setProperty("--scale",`${.72+row*.12}`);person.style.setProperty("--alpha",`${.46+row*.1}`);person.style.setProperty("--delay",`${-(row*0.22+col*.1)}s`);squad.append(person)}}stage.append(squad);return stage}
    function physicsStage(){const stage=el("aside","physics-stage");stage.setAttribute("aria-label","牛顿与伽利略物理学家剪影");const newton=el("div","physics-figure newton"),galileo=el("div","physics-figure galileo"),apple=el("i","physics-apple"),scope=el("i","physics-telescope");[newton,galileo].forEach((figure,name)=>{figure.append(el("i","physicist-head"),el("i","physicist-body"),el("span","physicist-name",name?"GALILEO":"NEWTON"))});stage.append(newton,galileo,apple,scope);return stage}
    let certificateItems=[],certificateIndex=0,certificateLastFocus=null;
    function normalizeCertificate(item,index){
      if(typeof item==="string")return{image:item,title:`AI 专项技能认证 ${String(index+1).padStart(2,"0")}`};
      return item;
    }
    function showCertificate(index){
      if(!certificateItems.length)return;
      certificateIndex=(index+certificateItems.length)%certificateItems.length;
      const certificate=normalizeCertificate(certificateItems[certificateIndex],certificateIndex),image=$("#lightboxImage");
      image.src=certificate.image;
      image.alt=`${certificate.title}证书大图`;
      $("#lightboxTitle").textContent=certificate.title;
      $("#lightboxCounter").textContent=`${certificateIndex+1} / ${certificateItems.length}`;
    }
    function openCertificateLightbox(items,index){
      const box=$("#certificateLightbox");
      certificateItems=[...items];
      certificateLastFocus=document.activeElement;
      showCertificate(index);
      box.classList.add("open");
      box.setAttribute("aria-hidden","false");
      document.body.classList.add("lightbox-lock");
      setTimeout(()=>$("#lightboxClose").focus(),120);
    }
    function closeCertificateLightbox(){const box=$("#certificateLightbox");box.classList.remove("open");box.setAttribute("aria-hidden","true");document.body.classList.remove("lightbox-lock");if(certificateLastFocus&&certificateLastFocus.focus)certificateLastFocus.focus()}
    function initCertificateLightbox(){const box=$("#certificateLightbox"),close=$("#lightboxClose"),prev=$("#lightboxPrev"),next=$("#lightboxNext"),image=$("#lightboxImage");close.onclick=closeCertificateLightbox;prev.onclick=()=>showCertificate(certificateIndex-1);next.onclick=()=>showCertificate(certificateIndex+1);box.addEventListener("click",event=>{if(event.target===box)closeCertificateLightbox()});image.onerror=()=>toast("证书图片未找到，请检查图片文件名");document.addEventListener("keydown",event=>{if(!box.classList.contains("open"))return;if(event.key==="Escape")closeCertificateLightbox();if(event.key==="ArrowLeft")showCertificate(certificateIndex-1);if(event.key==="ArrowRight")showCertificate(certificateIndex+1)})}
    function tabs(root,groups,type){const list=el("div","tablist");list.setAttribute("role","tablist");const panels=[],buttons=[];groups.filter(g=>g.items.length).forEach((g,i)=>{const b=el("button","tab",g.label),p=el("div","panel");b.type="button";b.id=`${type}-t-${g.id}`;b.setAttribute("role","tab");b.setAttribute("aria-selected",i===0?"true":"false");b.setAttribute("aria-controls",`${type}-p-${g.id}`);b.tabIndex=i===0?0:-1;p.id=`${type}-p-${g.id}`;p.setAttribute("role","tabpanel");p.setAttribute("aria-labelledby",b.id);p.hidden=i!==0;if(type==="experience"){const box=el("div","timeline");g.items.forEach(x=>{const a=el("article","entry"),head=el("div","entry-head"),left=el("div");left.append(el("h3","",x.title),el("div","org",x.org));head.append(left);a.append(head,bullets(x.bullets));addCardScene(a,`experience-${g.id}`);box.append(a)});p.append(box)}else{const box=el("div","projects");g.items.forEach(x=>{const a=el("article","project");a.append(el("h3","",x.name),el("p","",x.result));if(x.link){const link=el("a","project-link",x.linkLabel||"查看项目 ↗");link.href=x.link;link.target="_blank";link.rel="noopener";a.append(link)}const ts=el("div","tags");x.tags.forEach(y=>ts.append(el("span","tag",y)));a.append(ts);if(Array.isArray(x.gallery)&&x.gallery.length){a.classList.add("with-gallery");const section=el("section","certificate-section"),head=el("div","certificate-head"),headText=el("div");headText.append(el("h4","","AI证书作品集"),el("span","",`${x.gallery.length} 项学习认证 · 点击图片查看大图`));head.append(headText);section.append(head);const gallery=el("div","certificate-gallery");x.gallery.forEach((src,index)=>{const button=el("button","certificate-item"),img=el("img"),error=el("div","certificate-error","图片未找到\n请检查文件名"),label=el("span","certificate-label");button.type="button";button.setAttribute("aria-label",`查看第 ${index+1} 张AI证书`);img.src=src;img.alt=`AI学习证书 ${index+1}`;img.loading="lazy";img.decoding="async";img.onerror=()=>{img.style.display="none";error.style.display="grid"};label.append(el("span","",`AI证书 ${String(index+1).padStart(2,"0")}`),el("i","","查看 ↗"));button.append(img,error,label);button.onclick=()=>openCertificateLightbox(x.gallery,index);gallery.append(button)});section.append(gallery);a.append(section)}addCardScene(a,`project-${g.id}`);box.append(a)});if(g.id==="sport")box.append(sportStage());if(g.id==="training")box.append(honorGuardStage());if(g.id==="experiment")box.append(physicsStage());p.append(box)}list.append(b);root.append(p);buttons.push(b);panels.push(p)});root.prepend(list);function active(i,focus=false){buttons.forEach((b,j)=>{b.setAttribute("aria-selected",j===i);b.tabIndex=j===i?0:-1;panels[j].hidden=j!==i});if(focus)buttons[i].focus()}buttons.forEach((b,i)=>{b.onclick=()=>active(i);b.onkeydown=e=>{let n=null;if(e.key==="ArrowRight")n=(i+1)%buttons.length;if(e.key==="ArrowLeft")n=(i-1+buttons.length)%buttons.length;if(e.key==="Home")n=0;if(e.key==="End")n=buttons.length-1;if(n!==null){e.preventDefault();active(n,true)}}})}
    function skills(){const r=$("#skillGrid");resume.skills.forEach(g=>{const a=el("article","skill");a.append(el("h3","",g.name));const box=el("div","skill-items");g.items.forEach(x=>{const n=el("span","skill-item",x[0]);n.append(el("small","",x[1]));box.append(n)});a.append(box);r.append(a)})}
    function education(){const r=$("#educationGrid");resume.schools.forEach((s,index)=>{const e=el("article","edu");e.append(el("h3","",s.name),el("div","degree",[s.degree,`${s.start} — ${s.end}`].filter(Boolean).join(" · ")),el("p","",index===0?resume.educationText.university:resume.educationText.highSchool));r.append(e)});const h=el("article","honors");h.append(el("h3","","获奖与证书"));const ul=el("ul","award-list");resume.honors.forEach(x=>{const li=el("li"),i=el("i","","✦"),d=el("div");d.append(el("strong","",x));li.append(i,d);ul.append(li)});h.append(ul);r.append(h)}
    function initMusic(){
      const audio=$("#bgMusic"),button=$("#music");
      let timer=null,armed=false;
      const target=.35;
      audio.volume=0;

      function fade(to,done){
        clearInterval(timer);
        const steps=24,from=audio.volume,diff=(to-from)/steps;
        let step=0;
        timer=setInterval(()=>{
          step++;
          audio.volume=Math.max(0,Math.min(1,from+diff*step));
          if(step>=steps){
            clearInterval(timer);
            audio.volume=to;
            if(done)done();
          }
        },40);
      }

      function state(playing){
        button.classList.toggle("playing",playing);
        button.setAttribute("aria-pressed",String(playing));
        button.setAttribute("aria-label",playing?"暂停背景音乐":"播放背景音乐");
        button.title=playing?"暂停背景音乐":"播放背景音乐";
      }

      async function start(showMessage=false){
        if(!audio.paused){state(true);fade(target);return;}
        if(!audio.src){
          audio.src=audio.dataset.src;
          audio.load();
        }
        audio.volume=0;
        await audio.play();
        state(true);
        fade(target);
        if(showMessage)toast("背景音乐已播放");
      }

      function disarm(){
        if(!armed)return;
        armed=false;
        document.removeEventListener("pointerdown",unlock,true);
        document.removeEventListener("keydown",unlock,true);
      }

      function unlock(event){
        if(event.target&&button.contains(event.target))return;
        start(false).then(disarm).catch(()=>{});
      }

      function armFirstInteraction(){
        if(armed)return;
        armed=true;
        document.addEventListener("pointerdown",unlock,true);
        document.addEventListener("keydown",unlock,true);
      }

      button.onclick=async()=>{
        disarm();
        if(audio.paused){
          try{await start(true)}catch{toast("请再点击一次音乐按钮")}
        }else{
          fade(0,()=>{audio.pause();state(false);toast("背景音乐已暂停")});
        }
      };

      audio.addEventListener("error",()=>toast("音乐文件未找到，请检查 assets/audio 目录"));

      return {start,state,armFirstInteraction};
    }
    function initInteractiveTilt(){if(matchMedia("(prefers-reduced-motion:reduce)").matches||!matchMedia("(pointer:fine)").matches)return;document.querySelectorAll(".contact,.navbtn,.tab,.navlinks a,.brand").forEach(node=>{let tx=0,ty=0,cx=0,cy=0,frame=0;function render(){cx+=(tx-cx)*.16;cy+=(ty-cy)*.16;node.style.setProperty("--tilt-x",`${cx.toFixed(2)}deg`);node.style.setProperty("--tilt-y",`${cy.toFixed(2)}deg`);if(Math.abs(tx-cx)>.02||Math.abs(ty-cy)>.02){frame=requestAnimationFrame(render)}else{frame=0}}function request(){if(!frame)frame=requestAnimationFrame(render)}node.addEventListener("pointermove",event=>{const rect=node.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;tx=-y*7;ty=x*9;request()});node.addEventListener("pointerleave",()=>{tx=0;ty=0;request()})})}
    function initLargePanelTilt(){if(matchMedia("(prefers-reduced-motion:reduce)").matches||!matchMedia("(pointer:fine)").matches)return;document.querySelectorAll(".hero-card,.identity-card,.paper").forEach(node=>{let tx=0,ty=0,cx=0,cy=0,frame=0;function render(){cx+=(tx-cx)*.105;cy+=(ty-cy)*.105;node.style.setProperty("--panel-rx",`${cx.toFixed(3)}deg`);node.style.setProperty("--panel-ry",`${cy.toFixed(3)}deg`);if(Math.abs(tx-cx)>.006||Math.abs(ty-cy)>.006){frame=requestAnimationFrame(render)}else{frame=0}}function request(){if(!frame)frame=requestAnimationFrame(render)}node.addEventListener("pointermove",event=>{const rect=node.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;tx=-y*2.6;ty=x*3.5;request()});node.addEventListener("pointerleave",()=>{tx=0;ty=0;request()})})}
    function initAvatarTilt(){if(matchMedia("(prefers-reduced-motion:reduce)").matches||!matchMedia("(pointer:fine)").matches)return;const node=$(".avatar-card");if(!node)return;let tx=0,ty=0,cx=0,cy=0,frame=0;function render(){cx+=(tx-cx)*.13;cy+=(ty-cy)*.13;node.style.setProperty("--avatar-rx",`${cx.toFixed(2)}deg`);node.style.setProperty("--avatar-ry",`${cy.toFixed(2)}deg`);if(Math.abs(tx-cx)>.015||Math.abs(ty-cy)>.015){frame=requestAnimationFrame(render)}else{frame=0}}function request(){if(!frame)frame=requestAnimationFrame(render)}node.addEventListener("pointermove",event=>{const rect=node.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;tx=-y*7;ty=x*9;request()});node.addEventListener("pointerleave",()=>{tx=0;ty=0;request()})}

    function initHeroSignal(){
      const canvas=$("#signalCanvas"),section=$("#home");
      if(!canvas||!section)return;
      const context=canvas.getContext("2d"),reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
      let width=0,height=0,dpr=1,frame=0,nodes=[];
      const pointer={x:0,y:0,active:false};

      function createNode(index){
        const angle=Math.random()*Math.PI*2,speed=.08+Math.random()*.18;
        return{
          x:Math.random()*width,
          y:Math.random()*height,
          vx:Math.cos(angle)*speed,
          vy:Math.sin(angle)*speed,
          radius:index%9===0?3.4:1.3+Math.random()*1.6,
          accent:index%5===0,
        };
      }

      function resize(){
        const rect=section.getBoundingClientRect();
        width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(2,devicePixelRatio||1);
        canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
        canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
        context.setTransform(dpr,0,0,dpr,0,0);
        const count=Math.min(52,Math.max(28,Math.floor(width/30)));
        nodes=Array.from({length:count},(_,index)=>createNode(index));
      }

      function update(){
        nodes.forEach(node=>{
          if(pointer.active){
            const dx=pointer.x-node.x,dy=pointer.y-node.y,distance=Math.max(1,Math.hypot(dx,dy));
            if(distance<230){const pull=(1-distance/230)*.006;node.vx+=dx/distance*pull;node.vy+=dy/distance*pull;}
          }
          node.x+=node.vx;node.y+=node.vy;
          if(node.x<0||node.x>width)node.vx*=-1;
          if(node.y<0||node.y>height)node.vy*=-1;
        });
      }

      function draw(){
        context.clearRect(0,0,width,height);
        for(let i=0;i<nodes.length;i++){
          const a=nodes[i];
          for(let j=i+1;j<nodes.length;j++){
            const b=nodes[j],distance=Math.hypot(a.x-b.x,a.y-b.y);
            if(distance<155){
              context.strokeStyle=`rgba(255,255,255,${(1-distance/155)*.16})`;
              context.lineWidth=.7;context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.stroke();
            }
          }
        }
        nodes.forEach(node=>{
          context.fillStyle=node.accent?"rgba(44,232,255,.88)":"rgba(255,255,255,.62)";
          context.beginPath();context.arc(node.x,node.y,node.radius,0,Math.PI*2);context.fill();
          if(node.accent){
            context.strokeStyle="rgba(44,232,255,.2)";context.lineWidth=1;
            context.beginPath();context.arc(node.x,node.y,node.radius+7,0,Math.PI*2);context.stroke();
          }
        });
      }

      function loop(){update();draw();frame=requestAnimationFrame(loop);}
      function move(event){
        const rect=section.getBoundingClientRect();
        pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;pointer.active=true;
      }
      function leave(){pointer.active=false;}
      resize();
      section.addEventListener("pointermove",move);section.addEventListener("pointerleave",leave);addEventListener("resize",resize);
      if(reduced)draw();else loop();
      return()=>{cancelAnimationFrame(frame);section.removeEventListener("pointermove",move);section.removeEventListener("pointerleave",leave);removeEventListener("resize",resize)};
    }
    function initWelcomeFragments(){const screen=$("#welcomeScreen"),canvas=$("#welcomeCanvas"),coords=$("#welcomeCoords");if(!screen||!canvas)return{destroy(){}};const ctx=canvas.getContext("2d"),reduced=matchMedia("(prefers-reduced-motion:reduce)").matches,pointer={x:-9999,y:-9999,active:false};let width=0,height=0,dpr=1,frame=0,running=true,fragments=[],pulses=[];function createFragment(){const angle=Math.random()*Math.PI*2,speed=.12+Math.random()*.34;return{x:Math.random()*width,y:Math.random()*height,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:3+Math.random()*7,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.012,type:Math.floor(Math.random()*4),tone:Math.random()>.28?0:1}}function rebuild(){const count=Math.min(58,Math.max(24,Math.floor(width/27)));fragments=Array.from({length:count},createFragment)}function resize(){const rect=screen.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;ctx.setTransform(dpr,0,0,dpr,0,0);rebuild()}function shape(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle=p.tone?"rgba(25,198,223,.68)":"rgba(23,104,213,.62)";ctx.fillStyle=p.tone?"rgba(25,198,223,.1)":"rgba(23,104,213,.075)";ctx.lineWidth=1;if(p.type===0){ctx.beginPath();ctx.moveTo(0,-p.size);ctx.lineTo(p.size*.78,p.size*.65);ctx.lineTo(-p.size*.78,p.size*.65);ctx.closePath();ctx.fill();ctx.stroke()}else if(p.type===1){ctx.beginPath();ctx.rect(-p.size*.7,-p.size*.7,p.size*1.4,p.size*1.4);ctx.fill();ctx.stroke()}else if(p.type===2){ctx.beginPath();ctx.moveTo(-p.size,0);ctx.lineTo(p.size,0);ctx.moveTo(0,-p.size);ctx.lineTo(0,p.size);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(-p.size,0);ctx.lineTo(0,-p.size*.55);ctx.lineTo(p.size,0);ctx.lineTo(0,p.size*.55);ctx.closePath();ctx.fill();ctx.stroke()}ctx.restore()}function drawConnections(){for(let i=0;i<fragments.length;i++){for(let j=i+1;j<fragments.length;j++){const a=fragments[i],b=fragments[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<112){ctx.strokeStyle=`rgba(23,104,213,${(1-d/112)*.105})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}}}function drawMagnet(){if(!pointer.active)return;const pulse=25+Math.sin(performance.now()/260)*3;ctx.strokeStyle="rgba(23,104,213,.22)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(pointer.x,pointer.y,pulse,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="rgba(25,198,223,.34)";ctx.beginPath();ctx.arc(pointer.x,pointer.y,6,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(pointer.x-12,pointer.y);ctx.lineTo(pointer.x+12,pointer.y);ctx.moveTo(pointer.x,pointer.y-12);ctx.lineTo(pointer.x,pointer.y+12);ctx.stroke()}function update(){fragments.forEach((p,index)=>{p.angle+=p.spin;p.vx+=Math.sin(p.angle+index)*.0007;p.vy+=Math.cos(p.angle-index)*.0007;if(pointer.active){const dx=pointer.x-p.x,dy=pointer.y-p.y,d=Math.max(1,Math.hypot(dx,dy));if(d<195){const force=(1-d/195)*.058;p.vx+=dx/d*force;p.vy+=dy/d*force;if(d<28){p.vx*=.94;p.vy*=.94}}}const speed=Math.hypot(p.vx,p.vy);if(speed>.9){p.vx=p.vx/speed*.9;p.vy=p.vy/speed*.9}p.x+=p.vx;p.y+=p.vy;if(p.x<-18)p.x=width+18;if(p.x>width+18)p.x=-18;if(p.y<-18)p.y=height+18;if(p.y>height+18)p.y=-18});pulses=pulses.filter(p=>{p.radius+=3.2;p.alpha-=.018;if(p.alpha<=0)return false;ctx.strokeStyle=`rgba(23,104,213,${p.alpha*.35})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.stroke();return true})}function draw(){ctx.clearRect(0,0,width,height);drawConnections();fragments.forEach(shape);update()}function loop(){if(!running)return;draw();frame=requestAnimationFrame(loop)}function move(event){const rect=screen.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;pointer.active=true;if(coords)coords.textContent=`X ${String(Math.round(pointer.x)).padStart(4,"0")} / Y ${String(Math.round(pointer.y)).padStart(4,"0")}`}function leave(){pointer.active=false}function burst(event){if(event.target.closest&&event.target.closest("button"))return;const rect=screen.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;pulses.push({x,y,radius:4,alpha:1});fragments.forEach(p=>{const dx=p.x-x,dy=p.y-y,d=Math.max(18,Math.hypot(dx,dy));if(d<240){const force=(1-d/240)*2.4;p.vx+=dx/d*force;p.vy+=dy/d*force}})}resize();screen.addEventListener("pointermove",move);screen.addEventListener("pointerleave",leave);screen.addEventListener("pointerdown",burst);addEventListener("resize",resize);if(reduced){draw()}else{loop()}return{destroy(){running=false;cancelAnimationFrame(frame);screen.removeEventListener("pointermove",move);screen.removeEventListener("pointerleave",leave);screen.removeEventListener("pointerdown",burst);removeEventListener("resize",resize)}}}
    function initWelcome(music,fragments){
      const screen=$("#welcomeScreen"),enter=$("#enterSite");
      document.body.classList.add("welcome-lock");
      setTimeout(()=>enter.focus(),700);
      enter.onclick=()=>{
        enter.disabled=true;
        music.start(false).catch(()=>music.armFirstInteraction());
        screen.classList.add("leaving");
        document.body.classList.remove("welcome-lock");
        setTimeout(()=>{fragments.destroy();screen.remove()},900);
      };
    }
    function init(){
      hero();
      highlights();
      aiPath();
      tabs($("#experienceTabs"),resume.experience,"experience");
      tabs($("#projectTabs"),resume.projects,"project");
      skills();
      education();
      initSectionScenes();
      initPaperScenes();
      initCertificateLightbox();
      initInteractiveTilt();
      initLargePanelTilt();
      initAvatarTilt();
      initHeroSignal();

      const fragments=initWelcomeFragments(),music=initMusic();
      initWelcome(music,fragments);

      const dark=matchMedia("(prefers-color-scheme:dark)").matches;
      let saved="";
      try{saved=localStorage.getItem("resume-theme")||""}catch{}
      setTheme(saved||(dark?"dark":"light"));
      $("#theme").onclick=()=>{
        const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
        setTheme(next);
        try{localStorage.setItem("resume-theme",next)}catch{}
      };
      $("#print").onclick=()=>print();
      $("#backTop").onclick=()=>scrollTo({top:0,behavior:"smooth"});

      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}
      }),{threshold:.1});
      document.querySelectorAll(".paper,.ai-shell").forEach(node=>observer.observe(node));

      onscroll=()=>{
        $("#topbar").classList.toggle("scrolled",scrollY>12);
        $("#backTop").classList.toggle("show",scrollY>500);
        const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
        $("#scrollProgress").style.transform=`scaleX(${Math.min(1,scrollY/max)})`;
        const links=[...document.querySelectorAll(".navlinks a")];
        let id="";
        links.forEach(link=>{const section=$(link.getAttribute("href"));if(section&&scrollY>=section.offsetTop-140)id=section.id});
        links.forEach(link=>link.classList.toggle("active",link.getAttribute("href")===`#${id}`));
      };
      onscroll();
    }
    function setTheme(t){document.documentElement.dataset.theme=t;$("#theme").textContent=t==="dark"?"☀":"☾"}
    addEventListener("DOMContentLoaded",init);
