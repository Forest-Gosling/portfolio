let scene, camera, renderer, raycaster, mouse, controls;
let objects = [], interactiveObjects = [];
let hoveredObject = null;
let pulseTime = 0;
let hoverSound, clickSound;

const objectLinks = {};
const objectTooltips = {};

init();
animate();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10 );
    camera.position.x += 10;
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

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Load model
    const loader = new THREE.GLTFLoader();
    loader.load('/media/models/room/room.glb', function (gltf) {
        scene.add(gltf.scene);
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.userData.originalEmissive = child.material.emissive.clone();
                objects.push(child);

                // Server Rack setup
                if (child.name === "Server_Rack") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }

                // Photo setup
                if (child.name === "Photo") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";
                    objectTooltips[child.name] = {
                        title: "About Me",
                        description: "Watch This Space.",
                    };
                }

                // Guitar setup
                if (child.name === "Guitar") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }

                // Soldering Iron setup
                if (child.name === "Soldering_Iron") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }

                // Computer setup
                if (child.name === "Computer") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }
                
                // Monitor 1 setup
                if (child.name === "Monitor_1") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }

                // Monitor 2 setup
                if (child.name === "Monitor_2") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }

                // Monitor 3 setup
                if (child.name === "Monitor_3") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
                }

                // Template setup
                if (child.name === "Coming_soon") {
                    interactiveObjects.push(child);
                    objectLinks[child.name] = "coming_soon.html";  // Link to a new page
                    objectTooltips[child.name] = {
                        title: "Coming Soon",
                        description: "Watch This Space.",
                    };
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
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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
    controls.update();

    if (hoveredObject) {
        pulseTime += 0.005;
        const pulse = Math.sin(pulseTime * 5) * 0.5 + 0.5;
        hoveredObject.material.emissive.setRGB(0, pulse, 0);
    }

    renderer.render(scene, camera);
}
