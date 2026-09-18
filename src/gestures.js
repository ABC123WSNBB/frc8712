import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function features(points, previousPose='idle') {
  const scale=Math.max(distance(points[5],points[17]),.001);
  const bends=[5,9,13,17].map(i=>{
    const a=points[i], b=points[i+1], c=points[i+3];
    const u=[a.x-b.x,a.y-b.y,a.z-b.z],v=[c.x-b.x,c.y-b.y,c.z-b.z];
    return Math.acos(Math.max(-1,Math.min(1,u.reduce((s,x,j)=>s+x*v[j],0)/(Math.hypot(...u)*Math.hypot(...v)||1))));
  });
  const extended=bends.map((a,i)=>a>(previousPose==='zoomIn'?2.5:2.65)&&distance(points[8+i*4],points[0])>distance(points[6+i*4],points[0])*1.1);
  const thumb=distance(points[4],points[9])/scale;
  const open=extended.every(Boolean)&&thumb>(previousPose==='zoomIn'?.8:.95);
  const fist=bends.every(a=>a<(previousPose==='zoomOut'?1.95:1.75))&&[8,12,16,20].every(i=>distance(points[i],points[0])<distance(points[i-3],points[0])*1.35);
  const bowl=!open&&!fist&&bends.filter(a=>a>(previousPose==='rotate'?1.5:1.65)&&a<(previousPose==='rotate'?2.95:2.85)).length>=3;
  const pinch=distance(points[4],points[8])/scale;
  const openness=[8,12,16,20].reduce((sum,i)=>sum+distance(points[i],points[0])/scale,0)/4;
  const u={x:points[5].x-points[17].x,y:points[5].y-points[17].y,z:points[5].z-points[17].z};
  const v={x:points[9].x-points[0].x,y:points[9].y-points[0].y,z:points[9].z-points[0].z};
  const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
  // Normalize handedness/sign to prevent mirrored palms from reversing tilt.
  const sign=n.z<0?-1:1;
  return { pose:open?'zoomIn':fist?'zoomOut':bowl?'rotate':extended[0]?'point':'idle', openness, pinch, x:1-points[8].x,y:points[8].y,yaw:Math.atan2(n.x*sign,Math.abs(n.z)),pitch:Math.atan2(n.y*sign,Math.hypot(n.x,n.z)) };
}
export class GestureState {
  constructor(){this.reset();}
  reset(){this.mode='idle';this.candidate='idle';this.since=0;this.previous=null;this.pinched=false;this.locked=null;this.lastTarget=null;this.targetAt=0;this.pinchAt=0;this.pointTarget=null;this.pointSince=0;this.pointFired=false;}
  step(f,time,target){
    if(!f){this.reset();return {mode:'lost'};}
    if(f.pose==='point'&&target){this.lastTarget=target;this.targetAt=time;if(this.pointTarget!==target){this.pointTarget=target;this.pointSince=time;this.pointFired=false;}}
    // Use continuous finger openness so partial fists and partial spreads still zoom.
    if(!this.pinched && f.pose!=='point' && f.pose!=='rotate'){
    if(f.openness > 1.9) this.mode='zoomIn';
      else if(f.openness < 1.72) this.mode='zoomOut';
    if(!this.pinched && f.pose!=='point' && f.pose!=='rotate' && (f.openness>1.9||f.openness<1.72)) return {mode:this.mode};
    }
    if(f.pose==='point'&&this.pointTarget&&target===this.pointTarget&&!this.pointFired&&time-this.pointSince>420){this.pointFired=true;return {mode:'point',click:target};}
    if(this.pinched){
      if(time-this.pinchAt>1800){this.reset();return {mode:'idle'};}
      if(f.pinch>.44){const click=this.locked;const reset=!click;this.reset();return {mode:'point',click,reset};}
      if(!this.locked && time-this.pinchAt>300){const result={mode:'pinchRotate'};if(this.previous){let dx=f.yaw-this.previous.yaw,dy=f.pitch-this.previous.pitch;dx=Math.abs(dx)<.018?0:Math.max(-.12,Math.min(.12,dx));dy=Math.abs(dy)<.018?0:Math.max(-.12,Math.min(.12,dy));result.dx=dx;result.dy=dy;}this.previous={yaw:f.yaw,pitch:f.pitch};return result;}
      return {mode:'pinch'};
    }
    if(f.pinch<.42){
      this.pinched=true;this.pinchAt=time;this.locked=null;this.previous=null;return {mode:'pinch'};
    }
    if(f.pose!==this.candidate){this.candidate=f.pose;this.since=time;this.previous=null;}
    if(time-this.since<300){return {mode:'settling'};}
    if(this.mode!==f.pose){this.mode=f.pose;this.previous=null;}
    const result={mode:this.mode};
    if(this.mode==='rotate'){
      if(this.previous){result.dx=f.yaw-this.previous.yaw;result.dy=f.pitch-this.previous.pitch;}
      this.previous={yaw:f.yaw,pitch:f.pitch};
    }else this.previous=null;
    if(!['idle','point'].includes(this.mode)){this.lastTarget=null;}
    return result;
  }
}
export function createHandController({video,onFrame,onStatus,modelAssetPath='/mediapipe/hand_landmarker.task',wasmPath='/mediapipe/wasm'}){
  let detector,stream,frame,active=false,lastTime=-1,generation=0,disposed=false;
  return {
    async start(){
      if(disposed)throw new Error('Hand controller has been destroyed.');
      if(active)return;
      active=true;const current=++generation;
      try{
        onStatus('正在加载手势识别…');
        const vision=await FilesetResolver.forVisionTasks(wasmPath);
        if(current!==generation)return;
        if(!detector){const loaded=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minTrackingConfidence:.65});if(current!==generation){loaded.close();return;}detector=loaded;}
        if(current!==generation)return;
        const requested=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
        if(current!==generation){requested.getTracks().forEach(t=>t.stop());return;}
        stream=requested;video.srcObject=stream;await video.play();if(current!==generation)return;lastTime=-1;
        const loop=()=>{
          if(!active)return;
          try{
            if(video.readyState>=2&&video.currentTime!==lastTime){lastTime=video.currentTime;const results=detector.detectForVideo(video,performance.now());onFrame(results.landmarks[0]||null);}
            frame=requestAnimationFrame(loop);
          }catch(error){this.stop();onStatus(`识别暂停：${error.message}`);}
        };loop();
      }catch(error){if(current!==generation)return;this.stop();onStatus(error.name==='NotAllowedError'?'摄像头未获授权，仍可使用鼠标操作。':`摄像头启动失败：${error.message}`);throw error;}
    },
    stop(){active=false;generation++;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;onFrame(null);},
    destroy(){if(disposed)return;disposed=true;this.stop();detector?.close();detector=null;},
    get active(){return active;}
  };
}
