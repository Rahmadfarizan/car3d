import * as THREE from 'three'
import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor, AccumulativeShadows, RandomizedLight, Environment, Lightformer, Float, useGLTF } from '@react-three/drei'
import { LayerMaterial, Color, Depth } from 'lamina'

export function App() {
  const [degraded, degrade] = useState(false)
  const [activeAnimation, setActiveAnimation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  return (
    <>
      <Canvas shadows camera={{ position: [5, 0, 15], fov: 30 }}>
        <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} castShadow intensity={2} shadow-bias={-0.0001} />
        <ambientLight intensity={0.5} />
        <Porsche
          scale={1.6}
          position={[-0.5, -0.18, 0]}
          rotation={[0, Math.PI / 5, 0]}
          activeAnimation={activeAnimation}
          isAnimating={isAnimating}
        />
        <AccumulativeShadows position={[0, -1.16, 0]} frames={100} alphaTest={0.9} scale={10}>
          <RandomizedLight amount={8} radius={10} ambient={0.5} position={[1, 5, -1]} />
        </AccumulativeShadows>
        <PerformanceMonitor onDecline={() => degrade(true)} />
        <Environment frames={degraded ? 1 : Infinity} resolution={256} background blur={1}>
          <Lightformers />
        </Environment>
        <CameraRig />
      </Canvas>
      <Controls
        activeAnimation={activeAnimation}
        setActiveAnimation={setActiveAnimation}
        isAnimating={isAnimating}
        setIsAnimating={setIsAnimating}
      />
    </>
  )
}

function Porsche({ activeAnimation, isAnimating, ...props }) {
  const { scene, animations } = useGLTF('/car.glb');
  const mixer = useRef();
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [lastMouseY, setLastMouseY] = useState(0);
  const rotationSpeed = 0.00005;

  // const minYRotation = -Math.PI / 4;
  // const maxYRotation = Math.PI / 4;

  const minYRotation =-360;
  const maxYRotation =360;
  const minxRotation =0;
  const maxxRotation =360;

  useLayoutEffect(() => {
    mixer.current = new THREE.AnimationMixer(scene);
    const actions = animations.map((clip) => mixer.current.clipAction(clip));

    actions.forEach((action, index) => {
      if (index === activeAnimation) {
        action.play();
      } else {
        action.stop();
      }
    });

    return () => {
      actions.forEach((action) => action.stop());
    };
  }, [scene, animations, activeAnimation]);

  useEffect(() => {
    const actions = mixer.current?.actions || [];
    actions.forEach(action => action.paused = !isAnimating);
  }, [isAnimating]);

  useFrame((state, delta) => {
    if (mixer.current && isAnimating) mixer.current.update(delta);
  });

  const handleMouseDown = (event) => {
    if (event.button === 0) {
      setIsMouseDown(true);
      setLastMouseX(event.clientX);
      setLastMouseY(event.clientY);
    }
  };

  const handleMouseMove = (event) => {
    if (isMouseDown) {
      const deltaX = event.clientX - lastMouseX;
      const deltaY = event.clientY - lastMouseY;

      scene.rotation.y += deltaX * rotationSpeed;
      scene.rotation.x += deltaY * rotationSpeed;

      scene.rotation.y = Math.max(minYRotation, Math.min(maxYRotation, scene.rotation.y));
      scene.rotation.x = Math.max(minxRotation, Math.min(maxxRotation, scene.rotation.x));

      setLastMouseX(event.clientX);
      setLastMouseY(event.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown]);

  return <primitive object={scene} {...props} />;
}

function CameraRig({ v = new THREE.Vector3() }) {
  return useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.lerp(v.set(Math.sin(t / 5), 0, 12 + Math.cos(t / 5) / 2), 0.05);
    state.camera.lookAt(0, 0, 0);
  });
}

function Lightformers({ positions = [2, 0, 2, 0, 2, 0, 2, 0] }) {
  const group = useRef();
  useFrame((state, delta) => (group.current.position.z += delta * 10) > 20 && (group.current.position.z = -60));
  return (
    <>
      <Lightformer intensity={0.75} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
      <group rotation={[0, 0.5, 0]}>
        <group ref={group}>
          {positions.map((x, i) => (
            <Lightformer key={i} form="circle" intensity={2} rotation={[Math.PI / 2, 0, 0]} position={[x, 4, i * 4]} scale={[3, 1, 1]} />
          ))}
        </group>
      </group>
      <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
      <Lightformer rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[20, 0.5, 1]} />
      <Lightformer rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} />
      <Float speed={5} floatIntensity={2} rotationIntensity={2}>
        <Lightformer form="ring" color="red" intensity={1} scale={10} position={[-15, 4, -18]} target={[0, 0, 0]} />
      </Float>
      <mesh scale={100}>
        <sphereGeometry args={[1, 64, 64]} />
        <LayerMaterial side={THREE.BackSide}>
          <Color color="#444" alpha={1} mode="normal" />
          <Depth colorA="blue" colorB="black" alpha={0.5} mode="normal" near={0} far={300} origin={[100, 100, 100]} />
        </LayerMaterial>
      </mesh>
    </>
  );
}

function Controls({ activeAnimation, setActiveAnimation, isAnimating, setIsAnimating }) {
  const animations = ['Animation 1', 'Animation 2', 'Animation 3','Animation 4','Animation 5','Animation 6'];

  const toggleAnimation = () => {
    setIsAnimating((prev) => !prev);
  };

  const changeAnimation = (index) => {
    setActiveAnimation(index);
    setIsAnimating(true);
  };

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
      <button onClick={toggleAnimation}>
        {isAnimating ? 'Pause Animation' : 'Play Animation'}
      </button>
      <div>
        {animations.map((name, index) => (
          <button key={index} onClick={() => changeAnimation(index)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
