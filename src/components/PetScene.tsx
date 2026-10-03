import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MOODS, type MoodKey, type Species } from "@/lib/mood";

// Visual parameters per mood: body language drives everything.
const P: Record<MoodKey, { wag: number; amp: number; tailUp: number; ears: number; head: number; crouch: number; bounce: number; tremble: number; eye: number; turb: number }> = {
  happy: { wag: 14, amp: 0.7, tailUp: 0.9, ears: 0.35, head: 0.15, crouch: 0, bounce: 1, tremble: 0, eye: 0.35, turb: 0.2 },
  neutral: { wag: 3, amp: 0.15, tailUp: 0.25, ears: 0, head: 0, crouch: 0.03, bounce: 0.15, tremble: 0, eye: 1, turb: 0.35 },
  stress: { wag: 2, amp: 0.08, tailUp: -0.9, ears: -0.9, head: -0.35, crouch: 0.16, bounce: 0, tremble: 0.012, eye: 1.25, turb: 0.9 },
  alert: { wag: 20, amp: 0.25, tailUp: -0.2, ears: -1.4, head: -0.1, crouch: 0.22, bounce: 0, tremble: 0.03, eye: 1.5, turb: 1.8 },
};

const lerp = THREE.MathUtils.damp;

function Backdrop({ mood }: { mood: MoodKey }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const target = useMemo(() => new THREE.Color(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(MOODS[mood].color) }, uTurb: { value: 0.3 } }), []);
  useFrame((s, d) => {
    if (!mat.current) return;
    const u = mat.current.uniforms as { uTime: { value: number }; uColor: { value: THREE.Color }; uTurb: { value: number } };
    u.uTime.value = s.clock.elapsedTime;
    target.set(MOODS[mood].color);
    (u.uColor.value as THREE.Color).lerp(target, 1 - Math.exp(-3 * d));
    u.uTurb.value = lerp(u.uTurb.value, P[mood].turb, 2, d);
  });
  return (
    <mesh scale={40}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        ref={mat}
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
        fragmentShader={`
          uniform float uTime; uniform vec3 uColor; uniform float uTurb; varying vec3 vP;
          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
          void main(){
            vec3 d=normalize(vP); vec2 uv=d.xy*3.;
            float t=uTime*(0.08+uTurb*0.25);
            float v=n(uv+t)*.5+n(uv*2.3-t*1.3)*.3*uTurb+n(uv*5.-t*2.)*.2*uTurb;
            vec3 base=vec3(0.07,0.08,0.10);
            float glow=smoothstep(.2,1.,v)*(0.25+0.25*uTurb)*(1.-abs(d.y));
            gl_FragColor=vec4(base+uColor*glow,1.);
          }`}
      />
    </mesh>
  );
}

function Particles({ mood }: { mood: MoodKey }) {
  const N = 90;
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const seeds = useMemo(() => Array.from({ length: N }, (): [number, number, number, number] => [Math.random() * Math.PI * 2, 0.8 + Math.random() * 1.6, Math.random() * 3, Math.random()]), []);
  const pos = useMemo(() => new Float32Array(N * 3), []);
  const c = useMemo(() => new THREE.Color(), []);
  useFrame((s, d) => {
    const t = s.clock.elapsedTime;
    seeds.forEach(([a, r, y0, k], i) => {
      let x, y, z;
      if (mood === "happy") { const yy = (y0 + t * (0.4 + k * 0.4)) % 3; x = Math.cos(a + t * 0.3) * r; z = Math.sin(a + t * 0.3) * r; y = yy; }
      else if (mood === "neutral") { x = Math.cos(a + t * 0.1) * r * 1.3; z = Math.sin(a + t * 0.1) * r * 1.3; y = y0 * 0.8 + Math.sin(t + k * 6) * 0.1; }
      else if (mood === "stress") { const yy = 3 - ((y0 + t * (1.2 + k)) % 3); x = Math.cos(a) * r; z = Math.sin(a) * r; y = yy; }
      else { const rr = r * (0.7 + 0.5 * Math.abs(Math.sin(t * 6 + k * 9))); x = Math.cos(a + t * 2.5) * rr; z = Math.sin(a + t * 2.5) * rr; y = 0.4 + y0 * 0.6 + (Math.random() - 0.5) * 0.08; }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    });
    if (ref.current) ref.current.geometry.getAttribute("position").needsUpdate = true;
    if (mat.current) { c.set(MOODS[mood].color); mat.current.color.lerp(c, 1 - Math.exp(-4 * d)); mat.current.size = mood === "happy" ? 0.09 : mood === "alert" ? 0.06 : 0.05; }
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial ref={mat} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Pet({ species, mood }: { species: Species; mood: MoodKey }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const cur = useRef({ ...P.neutral });
  const isCat = species === "cat";
  const fur = isCat ? "#d98a4a" : "#c99a63";
  const furLight = isCat ? "#f3d9b8" : "#f4e6cf";

  useFrame((s, dRaw) => {
    const d = Math.min(dRaw, 0.05), t = s.clock.elapsedTime, c = cur.current, p = P[mood];
    (Object.keys(p) as (keyof typeof p)[]).forEach((k) => (c[k] = lerp(c[k], p[k], 4, d)));
    if (root.current) {
      const hop = Math.abs(Math.sin(t * 5)) * 0.18 * c.bounce;
      root.current.position.y = hop - c.crouch + Math.sin(t * 60) * c.tremble;
      root.current.position.x = Math.sin(t * 47) * c.tremble;
      root.current.rotation.z = Math.sin(t * 5) * 0.05 * c.bounce;
      const px = s.pointer.x * 0.4;
      root.current.rotation.y = lerp(root.current.rotation.y, px, 3, d);
    }
    if (head.current) { head.current.rotation.x = -c.head; head.current.rotation.z = Math.sin(t * 1.3) * 0.08 * (1 - c.crouch * 3); }
    if (tail.current) { tail.current.rotation.y = Math.sin(t * c.wag) * c.amp; tail.current.rotation.x = -c.tailUp; }
    const earBase = isCat ? 0 : 0.2;
    if (earL.current) earL.current.rotation.z = earBase + c.ears * 0.6;
    if (earR.current) earR.current.rotation.z = -earBase - c.ears * 0.6;
    if (earL.current) earL.current.rotation.x = -c.ears * 0.4;
    if (earR.current) earR.current.rotation.x = -c.ears * 0.4;
    if (eyes.current) { const blink = Math.sin(t * 1.7) > 0.985 ? 0.1 : 1; eyes.current.scale.set(c.eye, c.eye * blink * (mood === "happy" ? 0.45 : 1), c.eye); }
  });

  const m = (col: string, r = 0.75) => <meshStandardMaterial color={col} roughness={r} />;
  const leg = (x: number, z: number) => (
    <mesh position={[x, 0.3, z]} castShadow><capsuleGeometry args={[0.11, 0.4, 6, 12]} />{m(fur)}</mesh>
  );

  return (
    <group ref={root}>
      <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.78, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.36, isCat ? 0.7 : 0.8, 8, 20]} />{m(fur)}
        </mesh>
        <mesh position={[0.05, 0.7, 0.18]} scale={[1.2, 0.8, 0.6]}><sphereGeometry args={[0.3, 20, 20]} />{m(furLight)}</mesh>
        {leg(0.45, 0.18)}{leg(0.45, -0.18)}{leg(-0.45, 0.18)}{leg(-0.45, -0.18)}
        {/* tail */}
        <group ref={tail} position={[-0.8, 0.9, 0]}>
          <mesh position={[-0.25, 0.25, 0]} rotation={[0, 0, isCat ? 0.5 : 0.8]} castShadow>
            <capsuleGeometry args={[isCat ? 0.06 : 0.08, isCat ? 0.7 : 0.45, 6, 10]} />{m(fur)}
          </mesh>
        </group>
        {/* head */}
        <group ref={head} position={[0.85, 1.15, 0]}>
          <mesh castShadow scale={isCat ? [1, 0.92, 1.05] : [1.05, 1, 1]}><sphereGeometry args={[0.38, 28, 28]} />{m(fur)}</mesh>
          <mesh position={[0.3, -0.1, 0]} scale={isCat ? [0.6, 0.5, 0.7] : [1, 0.7, 0.75]}><sphereGeometry args={[0.2, 20, 20]} />{m(furLight)}</mesh>
          <mesh position={[isCat ? 0.42 : 0.5, -0.02, 0]}><sphereGeometry args={[isCat ? 0.04 : 0.065, 12, 12]} />{m("#2a1d1a", 0.3)}</mesh>
          <group ref={eyes}>
            {[0.15, -0.15].map((z) => (
              <mesh key={z} position={[0.3, 0.1, z]}><sphereGeometry args={[0.06, 14, 14]} /><meshStandardMaterial color="#111" roughness={0.1} /></mesh>
            ))}
          </group>
          {[1, -1].map((side) => (
            <group key={side} ref={side === 1 ? earL : earR} position={[0, 0.28, 0.2 * side]}>
              {isCat ? (
                <mesh position={[0, 0.14, 0]} rotation={[side * 0.2, 0, 0]} castShadow><coneGeometry args={[0.13, 0.3, 4]} />{m(fur)}</mesh>
              ) : (
                <mesh position={[0, 0.02, 0.08 * side]} rotation={[side * 0.9, 0, 0]} scale={[0.6, 1, 0.25]} castShadow><sphereGeometry args={[0.2, 14, 14]} />{m("#8a6038")}</mesh>
              )}
            </group>
          ))}
          {isCat && [1, -1].map((s) => (
            <mesh key={s} position={[0.42, -0.08, 0.1 * s]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.004, 0.004, 0.4]} />{m("#f5f5f5")}</mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function MoodLight({ mood }: { mood: MoodKey }) {
  const l = useRef<THREE.PointLight>(null);
  const c = useMemo(() => new THREE.Color(), []);
  useFrame((s, d) => {
    if (!l.current) return;
    c.set(MOODS[mood].color);
    l.current.color.lerp(c, 1 - Math.exp(-3 * d));
    l.current.intensity = mood === "alert" ? 18 + Math.sin(s.clock.elapsedTime * 8) * 10 : 14;
  });
  return <pointLight ref={l} position={[-2, 2.5, 2]} distance={10} />;
}

export default function PetScene({ species, mood }: { species: Species; mood: MoodKey }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0.6, 1.8, 4.6], fov: 40 }}>
      <Backdrop mood={mood} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <MoodLight mood={mood} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={1} color="#9cc" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      <group position={[0, -0.7, 0]}>
        <Pet key={species} species={species} mood={mood} />
        <Particles mood={mood} />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[2.2, 64]} />
          <meshStandardMaterial color="#1c2228" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
          <ringGeometry args={[2.1, 2.2, 96]} />
          <meshBasicMaterial color={MOODS[mood].color} />
        </mesh>
        <ContactShadows opacity={0.5} scale={5} blur={2.5} far={2} />
      </group>
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1} maxPolarAngle={1.5} target={[0, 0.2, 0]} />
    </Canvas>
  );
}
