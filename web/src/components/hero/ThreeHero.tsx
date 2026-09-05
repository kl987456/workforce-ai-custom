import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Ported from the Stitch landing-page mockup's inline Three.js snippet:
 * a rotating "neural network" — glass icosahedron core, wireframe shell,
 * orbiting node spheres with dynamically-rebuilt connecting lines, and a
 * soft particle field — reacting gently to mouse movement and scroll.
 */
export function ThreeHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const coreGeom = new THREE.IcosahedronGeometry(8, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x2563eb,
      emissiveIntensity: 0.22,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      thickness: 2,
      transparent: true,
      opacity: 0.85,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    worldGroup.add(core);

    const wireMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(10.2, 1),
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      })
    );
    worldGroup.add(wireMesh);

    const ringColors = [0x2563eb, 0x10b981];
    const rings: THREE.Mesh[] = ringColors.map((color, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(15 + i * 2.4, 0.06, 12, 96),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })
      );
      ring.rotation.x = Math.PI / 2.4 + i * 0.6;
      ring.rotation.y = i * 0.9;
      worldGroup.add(ring);
      return ring;
    });

    const nodeColors = [0x2563eb, 0x0ea5e9, 0x10b981, 0xf59e0b];
    const NODE_COUNT = 48;
    const nodeGeom = new THREE.SphereGeometry(0.32, 12, 12);
    const nodes: { mesh: THREE.Mesh; theta: number; phi: number; radius: number; speed: number }[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const radius = 13 + Math.random() * 6;
      const mat = new THREE.MeshBasicMaterial({
        color: nodeColors[i % nodeColors.length],
      });
      const mesh = new THREE.Mesh(nodeGeom, mat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      mesh.position.setFromSphericalCoords(radius, phi, theta);
      worldGroup.add(mesh);
      nodes.push({ mesh, theta, phi, radius, speed: 0.05 + Math.random() * 0.1 });
    }

    const maxLines = 70;
    const lineGeom = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxLines * 2 * 3);
    lineGeom.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.25,
    });
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    worldGroup.add(lines);

    // Soft-glow particle field via a canvas-generated radial-gradient sprite.
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    const PARTICLE_COUNT = 400;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 30 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.6,
      map: spriteTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dLight1 = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dLight1.position.set(20, 20, 20);
    scene.add(dLight1);
    const dLight2 = new THREE.DirectionalLight(0x2dd4bf, 0.6);
    dLight2.position.set(-20, -10, 10);
    scene.add(dLight2);
    const pLight = new THREE.PointLight(0x4f46e5, 0.8, 100);
    pLight.position.set(0, 0, 20);
    scene.add(pLight);

    let mouseX = 0,
      mouseY = 0,
      targetMouseX = 0,
      targetMouseY = 0;
    let scrollProgress = 0,
      targetScrollProgress = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let raf = 0;

    function animate() {
      raf = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      targetMouseX = mouseX;
      targetMouseY = mouseY;
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;

      worldGroup.rotation.y = time * 0.08 + targetMouseX * 0.4 + scrollProgress * 1.4;
      worldGroup.rotation.x = targetMouseY * 0.15;
      worldGroup.position.y = -scrollProgress * 6;

      core.scale.setScalar(1 + Math.sin(time * 0.8) * 0.02);
      rings.forEach((ring, i) => {
        ring.rotation.z = time * (0.05 + i * 0.02);
      });

      for (const n of nodes) {
        n.theta += n.speed * 0.01;
        n.mesh.position.setFromSphericalCoords(n.radius, n.phi, n.theta);
      }

      let lineIndex = 0;
      const posAttr = lineGeom.getAttribute("position") as THREE.BufferAttribute;
      outer: for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (lineIndex >= maxLines) break outer;
          const a = nodes[i].mesh.position;
          const b = nodes[j].mesh.position;
          if (a.distanceTo(b) < 7.5) {
            posAttr.setXYZ(lineIndex * 2, a.x, a.y, a.z);
            posAttr.setXYZ(lineIndex * 2 + 1, b.x, b.y, b.z);
            lineIndex++;
          }
        }
      }
      // Zero out unused line segments so stale lines don't linger on screen.
      for (let k = lineIndex; k < maxLines; k++) {
        posAttr.setXYZ(k * 2, 0, 0, 0);
        posAttr.setXYZ(k * 2 + 1, 0, 0, 0);
      }
      posAttr.needsUpdate = true;

      particles.rotation.y = time * 0.01;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      lineGeom.dispose();
      lineMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      spriteTexture.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
