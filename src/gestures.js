import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
// handpose_x-style static classification: 2D joint-angle constraints over 21 landmarks.
const angle2d=(a,b,c)=>{const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;return Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy)||1))))};
const fingerTriples=[[1,2,4],[5,6,8],[9,10,12],[13,14,16],[17,18,20]];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function features(points, previousPose='idle') {
  const scale=Math.max(distance(points[5],points[17]),.001);
  const bends=fingerTriples.map(([base,joint,tip])=>angle2d(points[base],points[joint],points[tip]));
  const extended=bends.map((a,i)=>a>2.45&&distance(points[fingerTriples[i][2]],points[0])>distance(points[fingerTriples[i][1]],points[0])*1.08);
  const open=extended.every(Boolean);
  const fist=bends.slice(1).every(a=>a<1.95)&&[8,12,16,20].every(i=>distance(points[i],points[0])<distance(points[i-3],points[0])*1.4);
  const bowl=!open&&!fist&&bends.slice(1).filter(a=>a>1.35&&a<2.75).length>=3;
  const pinch=distance(points[4],points[8])/scale;
  const openness=[8,12,16,20].reduce((sum,i)=>sum+distance(points[i],points[0])/scale,0)/4;
  const u={x:points[5].x-points[17].x,y:points[5].y-points[17].y,z:points[5].z-points[17].z};
  const v={x:points[9].x-points[0].x,y:points[9].y-points[0].y,z:points[9].z-points[0].z};
  const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
  // Normalize handedness/sign to prevent mirrored palms from reversing tilt.
  const sign=n.z<0?-1:1;
  return { pose:open?'zoomIn':fist?'zoomOut':bowl?'rotate':extended[0]?'point':'idle', openness, pinch, x:1-points[8].x,y:points[8].y,yaw:Math.atan2(n.x*sign,Math.abs(n.z)),pitch:Math.atan2(n.y*sign,Math.hypot(n.x,n.z)) };
}
export { GestureState, smoothFeatures, GESTURE_RATES } from './gesture-state.js';
export function createHandController({video,onFrame,onStatus,modelAssetPath=`${import.meta.env.BASE_URL}mediapipe/hand_landmarker.task`,wasmPath=`${import.meta.env.BASE_URL}mediapipe/wasm`}){
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
        if(!detector){const loaded=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath,delegate:'GPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});if(current!==generation){loaded.close();return;}detector=loaded;}
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
