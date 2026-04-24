import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { timelineBus } from "../hooks/useScrollTimeline";
import { sampleCamera } from "../timeline/cameraRig";
import { TIMELINE } from "../timeline/timeline";
import { damp, pulse } from "../utils/math";

// Camera rig driven entirely by timeline progress.
// Adds a small critically-damped inertia so whip-pans feel hand-held, plus a
// micro-shake during detonation for tactile punch.

const _tmpTarget = new THREE.Vector3();
const _tmpPos = new THREE.Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const lookAt = useRef(new THREE.Vector3(0, 0.6, 0));

  useFrame((_, dt) => {
    const p = timelineBus.progress;
    const pose = sampleCamera(TIMELINE.cameraKeys, p);

    // Shake envelope peaks at detonation.
    const shake = pulse(p, 0.5, 0.58, 0.72);
    const shakeX = (Math.random() - 0.5) * 0.06 * shake;
    const shakeY = (Math.random() - 0.5) * 0.06 * shake;

    // Micro-parallax from scroll velocity — gives hand-held feel.
    const v = timelineBus.velocity;
    const handheldX = Math.sin(performance.now() * 0.0007) * 0.02;
    const handheldY = Math.cos(performance.now() * 0.0005) * 0.015;

    _tmpPos.set(
      pose.position[0] + shakeX + handheldX,
      pose.position[1] + shakeY + handheldY,
      pose.position[2] + Math.min(0.1, Math.abs(v) * 4)
    );
    _tmpTarget.set(pose.target[0], pose.target[1], pose.target[2]);

    // Critically-damped follow.
    camera.position.x = damp(camera.position.x, _tmpPos.x, 8, dt);
    camera.position.y = damp(camera.position.y, _tmpPos.y, 8, dt);
    camera.position.z = damp(camera.position.z, _tmpPos.z, 8, dt);

    lookAt.current.x = damp(lookAt.current.x, _tmpTarget.x, 6, dt);
    lookAt.current.y = damp(lookAt.current.y, _tmpTarget.y, 6, dt);
    lookAt.current.z = damp(lookAt.current.z, _tmpTarget.z, 6, dt);
    camera.lookAt(lookAt.current);

    const targetFov = pose.fov;
    camera.fov = damp(camera.fov, targetFov, 5, dt);
    camera.updateProjectionMatrix();
  });

  return null;
}
