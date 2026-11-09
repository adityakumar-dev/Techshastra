import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface EarthGlobeProps {
  className?: string;
}

export default function EarthGlobe({ className = "" }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isDisposed = false;

    // Dimensions
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Root Group for rotation
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const dayTexture = textureLoader.load("/textures/earth_atmos.jpg");
    const lightsTexture = textureLoader.load("/textures/earth_lights.png");

    dayTexture.colorSpace = THREE.SRGBColorSpace;
    lightsTexture.colorSpace = THREE.SRGBColorSpace;

    // ── 1. Earth Sphere ──
    const earthRadius = 1.9;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Custom shader material for the photorealistic Night Earth with City Lights + Atmospheric Rim
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        lightsTexture: { value: lightsTexture },
        sunDirection: { value: new THREE.Vector3(1.2, 0.4, 1.0).normalize() },
        atmosphereColor: { value: new THREE.Color(0x38bdf8) }, // cyan/blue rim
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D lightsTexture;
        uniform vec3 sunDirection;
        uniform vec3 atmosphereColor;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          vec3 normal = normalize(vNormal);

          // Base colors
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 lightsColor = texture2D(lightsTexture, vUv);

          // Deep space blue tint for ocean/dark areas
          vec3 oceanNight = vec3(0.015, 0.035, 0.08) * (1.0 - lightsColor.r);

          // City lights with golden/amber glow
          vec3 cityLights = lightsColor.rgb * vec3(1.0, 0.85, 0.55) * 2.8;

          // Day land subtly visible in twilight
          vec3 landTwilight = dayColor.rgb * vec3(0.12, 0.18, 0.3);

          vec3 baseColor = oceanNight + landTwilight + cityLights;

          // Atmospheric Fresnel Rim Glow
          float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
          fresnel = pow(fresnel, 2.8);
          vec3 rimGlow = atmosphereColor * fresnel * 1.8;

          vec3 finalColor = baseColor + rimGlow;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    worldGroup.add(earthMesh);

    // ── 2. Outer Atmospheric Halo Glow ──
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.08, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        color: { value: new THREE.Color(0x0284c7) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * 0.8);
        }
      `,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    worldGroup.add(atmosphereMesh);

    // ── 3. Orbital Constellation Network (Satellite Rings + Nodes) ──
    const orbitGroup = new THREE.Group();
    worldGroup.add(orbitGroup);

    // Define 5 distinct orbital planes with inclinations
    const orbitalPlanes = [
      { rX: 0.35, rY: 0.2, rZ: 0.55, radius: 2.22, satellites: 5, speed: 0.008 },
      { rX: -0.65, rY: 0.4, rZ: -0.3, radius: 2.30, satellites: 6, speed: -0.007 },
      { rX: 0.85, rY: -0.5, rZ: 0.8, radius: 2.38, satellites: 6, speed: 0.006 },
      { rX: -0.2, rY: 0.9, rZ: -0.6, radius: 2.25, satellites: 5, speed: -0.009 },
      { rX: 0.5, rY: -0.8, rZ: -0.4, radius: 2.34, satellites: 6, speed: 0.007 },
    ];

    interface SatelliteNode {
      ringGroup: THREE.Group;
      mesh: THREE.Mesh;
      angle: number;
      radius: number;
      speed: number;
    }

    const satelliteNodes: SatelliteNode[] = [];
    const allSatellitesGlobal: THREE.Vector3[] = [];

    orbitalPlanes.forEach((plane, planeIdx) => {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.set(plane.rX, plane.rY, plane.rZ);
      orbitGroup.add(ringGroup);

      // Orbital Path Ring
      const segments = 100;
      const ringPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            Math.cos(theta) * plane.radius,
            Math.sin(theta) * plane.radius,
            0
          )
        );
      }
      const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const orbitLine = new THREE.LineLoop(ringGeom, ringMat);
      ringGroup.add(orbitLine);

      // Satellites on this orbit
      for (let s = 0; s < plane.satellites; s++) {
        const startAngle = (s / plane.satellites) * Math.PI * 2;
        const satGeom = new THREE.SphereGeometry(0.038, 12, 12);
        const satMat = new THREE.MeshBasicMaterial({
          color: 0xe0f2fe, // bright white-blue
        });
        const satMesh = new THREE.Mesh(satGeom, satMat);

        // Halo sprite for the glowing satellite point
        const haloGeom = new THREE.SphereGeometry(0.075, 8, 8);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
        });
        satMesh.add(new THREE.Mesh(haloGeom, haloMat));

        ringGroup.add(satMesh);

        satelliteNodes.push({
          ringGroup,
          mesh: satMesh,
          angle: startAngle,
          radius: plane.radius,
          speed: plane.speed,
        });
      }
    });

    // ── 4. Dynamic Constellation Mesh Lines connecting satellites ──
    const maxLines = 40;
    const linePositions = new Float32Array(maxLines * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const constellationLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(constellationLines);

    // ── 5. Mouse & Touch Drag Interaction ──
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velocityX = 0.0018; // idle spin
    let velocityY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      prevMouseX = clientX;
      prevMouseY = clientY;

      velocityX = deltaX * 0.004;
      velocityY = deltaY * 0.004;

      worldGroup.rotation.y += velocityX;
      worldGroup.rotation.x += velocityY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    dom.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // ── 6. Resize Observer ──
    const resizeObserver = new ResizeObserver(() => {
      if (!container || isDisposed) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth && newHeight) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // ── 7. Animation Loop ──
    const tempVec = new THREE.Vector3();

    const animate = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(animate);

      // Inertia & Auto-spin
      if (!isDragging) {
        velocityX = velocityX * 0.95 + 0.0018 * 0.05;
        velocityY *= 0.95;
      }
      worldGroup.rotation.y += velocityX;
      worldGroup.rotation.x += velocityY;

      // Update Satellites along their orbits
      allSatellitesGlobal.length = 0;
      satelliteNodes.forEach((node) => {
        node.angle += node.speed;
        node.mesh.position.set(
          Math.cos(node.angle) * node.radius,
          Math.sin(node.angle) * node.radius,
          0
        );

        // Get world position for inter-satellite connecting lines
        node.mesh.getWorldPosition(tempVec);
        allSatellitesGlobal.push(tempVec.clone());
      });

      // Update Constellation Lines connecting close satellites
      let lineCount = 0;
      const posArray = lineGeometry.attributes.position.array as Float32Array;
      const maxConnectDist = 2.1;

      for (let i = 0; i < allSatellitesGlobal.length && lineCount < maxLines; i++) {
        for (let j = i + 1; j < allSatellitesGlobal.length && lineCount < maxLines; j++) {
          const dist = allSatellitesGlobal[i].distanceTo(allSatellitesGlobal[j]);
          if (dist < maxConnectDist) {
            const idx = lineCount * 6;
            posArray[idx] = allSatellitesGlobal[i].x;
            posArray[idx + 1] = allSatellitesGlobal[i].y;
            posArray[idx + 2] = allSatellitesGlobal[i].z;
            posArray[idx + 3] = allSatellitesGlobal[j].x;
            posArray[idx + 4] = allSatellitesGlobal[j].y;
            posArray[idx + 5] = allSatellitesGlobal[j].z;
            lineCount++;
          }
        }
      }

      lineGeometry.setDrawRange(0, lineCount * 2);
      lineGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ──
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      dom.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);

      dom.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      if (container.contains(dom)) {
        container.removeChild(dom);
      }

      // Dispose Three.js resources
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      dayTexture.dispose();
      lightsTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] md:max-w-[500px] mx-auto cursor-grab active:cursor-grabbing ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}

