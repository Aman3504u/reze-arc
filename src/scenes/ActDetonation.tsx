import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useActScene } from '../hooks/useActScene'
import { SeededRandom } from '../utils/random'
import { smoothstep } from '../utils/easing'
import { shockwaveVert, shockwaveFrag } from '../fx/shaders/shockwave'

/**
 * Act IV — Detonation.
 *
 * The centerpiece. We budget aggressively here because the camera rig is
 * shaking, postprocessing is pumping, and the audio is roaring — the viewer
 * will not count polygons. We lean into:
 *
 *   - GPU instancing for ~2500 debris chunks (cheap boxes w/ HDR emissive)
 *   - A custom shockwave shader on a large plane that radiates outward.
 *   - A burst of 800 ember points that rise, flicker, and die.
 *
 * The whole act is a physics illusion: every piece is parameter-driven
 * by `sub` (local act progress) with no actual simulation loop, which means
 * the scrub is perfectly reversible. Scrolling back rewinds the explosion.
 */
export default function ActDetonation() {
  const { visibility, sub } = useActScene('detonation')
  const groupRef = useRef<THREE.Group>(null)
  const debrisRef = useRef<THREE.InstancedMesh>(null)
  const shockRef = useRef<THREE.ShaderMaterial>(null)
  const embersRef = useRef<THREE.Points>(null)

  const DEBRIS = 2400
  const EMBERS = 900
  const rand = useMemo(() => new SeededRandom(911), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const debrisSeeds = useMemo(
    () =>
      new Array(DEBRIS).fill(0).map(() => ({
        dir: new THREE.Vector3(
          rand.range(-1, 1),
          rand.range(0.1, 1),
          rand.range(-1, 1),
        ).normalize(),
        speed: rand.range(3, 9),
        spin: new THREE.Vector3(rand.range(-4, 4), rand.range(-4, 4), rand.range(-4, 4)),
        scale: rand.range(0.02, 0.08),
      })),
    [rand],
  )

  const emberGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(EMBERS * 3)
    const dirs = new Float32Array(EMBERS * 3)
    const life = new Float32Array(EMBERS)
    for (let i = 0; i < EMBERS; i++) {
      pos[i * 3] = 0
      pos[i * 3 + 1] = 1.5
      pos[i * 3 + 2] = 0
      const d = new THREE.Vector3(
        rand.range(-1, 1),
        rand.range(0, 1.5),
        rand.range(-1, 1),
      ).normalize()
      dirs[i * 3] = d.x
      dirs[i * 3 + 1] = d.y
      dirs[i * 3 + 2] = d.z
      life[i] = rand.range(0.6, 1.4)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3))
    g.setAttribute('aLife', new THREE.BufferAttribute(life, 1))
    return g
  }, [rand])

  const shockUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color('#ffd6a8') },
      uCore: { value: new THREE.Color('#ffffff') },
    }),
    [],
  )

  const emberMat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uIntensity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aDir;
        attribute float aLife;
        uniform float uProgress;
        uniform float uIntensity;
        varying float vAlpha;
        void main() {
          float t = clamp(uProgress / aLife, 0.0, 1.0);
          vec3 p = position + aDir * (t * 3.5);
          p.y -= t * t * 1.2; // gravity
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + (1.0 - t) * 4.0) * (300.0 / -mv.z) * uIntensity;
          vAlpha = (1.0 - t) * uIntensity;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          vec3 col = mix(vec3(1.0, 0.55, 0.2), vec3(1.0, 0.95, 0.7), a);
          gl_FragColor = vec4(col, a * vAlpha);
        }
      `,
    })
    return m
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.visible = visibility > 0.001

    // The detonation arc is modeled as three parameters derived from `sub`:
    //   expand  — how far debris has flown from origin (0 → 1)
    //   settle  — how much gravity + drag has pulled them down + slowed spin
    //   ignition— the brief white-hot core flash near the start of the act
    const ignition = Math.max(0, 1 - Math.abs(sub - 0.08) / 0.08)
    const expand = smoothstep((sub - 0.02) / 0.38)
    const settle = smoothstep((sub - 0.35) / 0.55)

    if (debrisRef.current) {
      for (let i = 0; i < DEBRIS; i++) {
        const s = debrisSeeds[i]
        // Radial flight dampens once `settle` kicks in — drag model.
        const r = s.speed * expand * (1 - settle * 0.25)
        const gravityY = -settle * settle * 1.6
        let y = 1.5 + s.dir.y * r + gravityY
        if (y < 0.04) y = 0.04 + (0.04 - y) * 0.1 // gentle floor bounce
        dummy.position.set(s.dir.x * r, y, s.dir.z * r)
        const rot = expand * 6 * (1 - settle * 0.5)
        dummy.rotation.set(
          s.spin.x * rot * 0.2,
          s.spin.y * rot * 0.2,
          s.spin.z * rot * 0.2,
        )
        const sc = s.scale * (1 - settle * 0.2)
        dummy.scale.setScalar(sc)
        dummy.updateMatrix()
        debrisRef.current.setMatrixAt(i, dummy.matrix)
      }
      debrisRef.current.instanceMatrix.needsUpdate = true
      const mat = debrisRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 2.5 * (1 - settle * 0.7) + ignition * 4
    }

    if (shockRef.current) {
      shockUniforms.uProgress.value = expand
      shockUniforms.uIntensity.value = visibility * (1 - settle * 0.85)
    }

    if (embersRef.current) {
      const mat = embersRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uProgress.value = expand * 1.4
      mat.uniforms.uIntensity.value = visibility * (1 - settle * 0.6)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#15060a" roughness={1} />
      </mesh>

      {/* shockwave */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[30, 30, 64, 64]} />
        <shaderMaterial
          ref={shockRef}
          uniforms={shockUniforms}
          vertexShader={shockwaveVert}
          fragmentShader={shockwaveFrag}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* ignition core — a bright emissive sphere that flashes once and collapses */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color="#ffe1b0"
          toneMapped={false}
          transparent
          opacity={Math.max(0, 1 - Math.abs(sub - 0.1) / 0.08)}
        />
      </mesh>

      {/* debris */}
      <instancedMesh
        ref={debrisRef}
        args={[undefined, undefined, DEBRIS]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#2a1410"
          emissive="#ff4a28"
          emissiveIntensity={2.5}
          roughness={0.8}
          metalness={0.2}
          toneMapped={false}
        />
      </instancedMesh>

      {/* embers */}
      <points ref={embersRef} geometry={emberGeom} material={emberMat} />
    </group>
  )
}
