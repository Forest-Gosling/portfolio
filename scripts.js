let scene, camera, renderer, raycaster, mouse, controls;
let objects = [],
    interactiveObjects = [];
let hoveredObject = null;
let pulseTime = 0;
let hoverSound, clickSound;
let deviceControlsEnabled = false;
let deviceControls;

const objectLinks = {};
const objectTooltips = {};

init();
animate();

function init() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 5, 10);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            if (event.alpha || event.beta || event.gamma) {
                deviceControls = new THREE.DeviceOrientationControls(camera);
                deviceControlsEnabled = true;
            }
        }, { once: true });
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    const loader = new THREE.GLTFLoader();
    loader.load('/media/models/room/room.glb', function(gltf) {
        scene.add(gltf.scene);
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.userData.originalEmissive = child.material.emissive.clone();
                objects.push(child);

                const name = child.name;
                const tooltip = {
                    "Server_Rack": { title: "Server Rack", description: "Watch This Space." },
                    "Photo": { title: "About Me", description: "Watch This Space." },
                    "Guitar": { title: "Guitar", description: "Watch This Space." },
                    "Soldering_Iron": { title: "Soldering Iron", description: "Watch This Space." },
                    "Computer": { title: "PC", description: "Watch This Space." },
                    "Monitor_1": { title: "Monitor_1", description: "Watch This Space." },
                    "Monitor_2": { title: "Monitor_2", description: "Watch This Space." },
                    "Monitor_3": { title: "Monitor_3", description: "Watch This Space." },
                    "Coming_soon": { title: "Coming Soon", description: "Watch This Space." }
                };

                if (tooltip[name]) {
                    interactiveObjects.push(child);
                    objectLinks[name] = "coming_soon.html";
                    objectTooltips[name] = tooltip[name];
                }
            }
        });
    });

    hoverSound = new Audio('/media/sounds/hover.mp3');
    clickSound = new Audio('/media/sounds/click.mp3');
    hoverSound.volume = 0.5;
    clickSound.volume = 0.5;

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onClick, false);
    window.addEventListener('touchstart', onTouchStart, false); // 👈 Added for mobile
    window.addEventListener('resize', onWindowResize, false);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const tooltip = document.getElementById("tooltip");
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects, true);

    let newHovered = null;
    if (intersects.length > 0) {
        const first = intersects[0].object;
        if (interactiveObjects.includes(first)) {
            newHovered = first;
        }
    }

    if (newHovered !== hoveredObject) {
        if (hoveredObject) {
            hoveredObject.material.emissive.copy(hoveredObject.userData.originalEmissive);
        }

        if (newHovered) {
            hoveredObject = newHovered;
            pulseTime = 0;
            hoverSound.currentTime = 0;
            hoverSound.play();

            const info = objectTooltips[hoveredObject.name];
            if (info) {
                tooltip.innerHTML = `
                    <strong>${info.title}</strong><br>
                    ${info.description}<br>
                    ${info.image ? `<img src="${info.image}" style="max-width: 100px; margin-top: 5px;">` : ""}
                `;
                tooltip.style.display = "block";
            }
        } else {
            hoveredObject = null;
            tooltip.style.display = "none";
        }
    }

    if (!newHovered) {
        if (hoveredObject) {
            hoveredObject.material.emissive.copy(hoveredObject.userData.originalEmissive);
            hoveredObject = null;
        }
        tooltip.style.display = "none";
    }
}

function onClick(event) {
    handleInteraction(event.clientX, event.clientY);
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    }
}

function handleInteraction(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
        const first = intersects[0].object;
        if (interactiveObjects.includes(first)) {
            const url = objectLinks[first.name];
            if (url) {
                clickSound.currentTime = 0;
                clickSound.play();
                setTimeout(() => window.open(url, '_blank'), 100);
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (deviceControlsEnabled && deviceControls) {
        deviceControls.update();
    } else {
        controls.update();
    }

    if (hoveredObject) {
        pulseTime += 0.005;
        const pulse = Math.sin(pulseTime * 5) * 0.5 + 0.5;
        hoveredObject.material.emissive.setRGB(0, pulse, 0);
    }

    renderer.render(scene, camera);
}