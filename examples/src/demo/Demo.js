import * as THREE from 'three'
import React, { useState, useCallback, useEffect, useRef, useMemo, Suspense } from 'react'
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { GlitchPass } from './../resources/postprocessing/GlitchPass'
import { WaterPass } from './../resources/postprocessing/WaterPass'

import Model from './Model'
import { getMousePos } from "./utils"

// Makes these prototypes available as "native" jsx-string elements
extend({ EffectComposer, ShaderPass, RenderPass, WaterPass, UnrealBloomPass, FilmPass, GlitchPass })

const halfPi = Math.PI/2;

const count = 200;
const maxZ = 50;
const minZ = 55; 

function Swarm({ count, mouse }) {
  const mesh = useRef()
  const light = useRef()
  const { viewport } = useThree()
  const aspect = viewport().factor
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {

      const 
        r = Math.random() * 10 + 20 ,//радиус
        angle = Math.random() * 6.28,
        zLen = Math.random() * 2 + 0.1,
        t = Math.random() * halfPi,
        speed = 0.02 + Math.random() / 100,
        x = -Math.sin(angle) * r,
        y = Math.cos(angle) * r

      temp.push({r, t, speed, x, y, zLen});
    }
    return temp
  }, [count])

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { r, t, speed, x, y, zLen } = particle;
 
      t = particle.t += speed;
      if (t > halfPi) t = particle.t = 0;

      const z = -maxZ * Math.sin(t) + minZ;

      dummy.position.set(x, y, z);
      dummy.scale.set(1, 1, zLen)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix);
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>

      <instancedMesh ref={mesh} args={[null, null, count]}>
        <boxGeometry attach="geometry" args={[0.01, 0.5, 10]} />
        <meshStandardMaterial attach="material" color={Math.random() * 0xffffff} roughness={0.5} metalness={0.5} />
      </instancedMesh>
    </>
  )
}

function Effect({ down }) {
  const composer = useRef()
  const { scene, gl, size, camera } = useThree();
  if (down) {
    camera.position.x = 0;
    camera.position.y = 0;
    camera.rotation.x = 0.3;

  } else {
    camera.position.x = -15;
    camera.position.y = 0;
    camera.rotation.x = 0;
  }
  const aspect = useMemo(() => new THREE.Vector2(size.width, size.height), [size])
  useEffect(() => void composer.current.setSize(size.width, size.height), [size])
  useFrame(() => composer.current.render(), 1)
  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <waterPass attachArray="passes" factor={down ? 0 : 0}/>
      <unrealBloomPass attachArray="passes" args={[aspect, 2, 1, 0]} />
      <filmPass attachArray="passes" factor={down ? 1 : 0} args={[0.25, 0.4, 1500, false]} />
      <glitchPass attachArray="passes" factor={down ? 1 : 0} />
    </effectComposer>
  )
}

export default function App() {
  const [down, set] = useState(false)
  const mouse = useRef({x: 0, y: 0})
  const onMouseMove = useCallback(
    ({ clientX: x, clientY: y }) => (mouse.current = [x - window.innerWidth / 2, y - window.innerHeight / 2]),
    []
  )
  return (
    <div
      style={{ width: '100%', height: '100%' }}
      onMouseMove={(e) => (mouse.current = getMousePos(e))}
      onMouseUp={() => set(false)}
      onMouseDown={() => set(true)}
    >
      <Canvas camera={{ fov: 100, position: [0, 0, 50]}}>
        <ambientLight intensity={1} />
        <pointLight distance={60} intensity={1} color="white" />
        <Swarm mouse={mouse} count={count} />
        <Suspense fallback = {null}>
          <Model mouse={mouse} position={[0, -30, 20]} scale={[0.2, 0.2, 0.2]}/>
        </Suspense>
        
        <Effect down={down} />
      </Canvas>
    </div>
  )
}
