let scene, camera, renderer, raycaster, mouse, controls;
let objects = [],
    interactiveObjects = [];
let hoveredObject = null;
let pulseTime = 0;
let hoverSound, clickSound;
let deviceControlsEnabled = false;
let deviceControls;
let startTouch = null;
let clickThreshold = 5;

const objectLinks = {};
const objectTooltips = {};

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

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
                    "server_rack": { title: "Server Rack", description: "Watch This Space." },
                    "photo": { title: "About Me", description: "Watch This Space." },
                    "guitar": { title: "Guitar", description: "Watch This Space." },
                    "soldering_iron": { title: "Soldering Iron", description: "Watch This Space." },
                    "computer": { title: "PC", description: "Watch This Space." },
                    "monitor_1": { title: "Monitor_1", description: "Watch This Space." },
                    "monitor_2": { title: "Monitor_2", description: "Watch This Space." },
                    "monitor_3": { title: "Monitor_3", description: "Watch This Space." },
                    "coming_soon": { title: "Coming Soon", description: "Watch This Space." }
                };

                if (tooltip[name]) {
                    interactiveObjects.push(child);
                    const links = {
                        "server_rack": "comingsoon.html",
                        "photo": "aboutme.html",
                        "guitar": "comingsoon.html",
                        "soldering_iron": "comingsoon.html",
                        "computer": "comingsoon.html",
                        "monitor_1": "comingsoon.html",
                        "monitor_2": "comingsoon.html",
                        "monitor_3": "", // Local Snake game instead
                        "coming_soon": "comingsoon.html"
                    };
                    objectLinks[name] = links[name];
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
    window.addEventListener('click', (event) => {
        handleInteraction(event.clientX, event.clientY);
    }, false);

    window.addEventListener('touchstart', onTouchStart, false);
    window.addEventListener('touchend', onTouchEnd, false);
    window.addEventListener('resize', onWindowResize, false);
}

function findInteractiveParent(object) {
    while (object && !interactiveObjects.includes(object)) {
        object = object.parent;
    }
    return object;
}

function handleInteraction(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
        const first = findInteractiveParent(intersects[0].object);
        if (first) {
            clickSound.currentTime = 0;
            clickSound.play();

            if (first.name === "Monitor_3") {
                document.getElementById("gameboy-modal").style.display = "flex";
                startSnakeGame();
            } else if (objectLinks[first.name]) {
                setTimeout(() => window.open(objectLinks[first.name], '_blank'), 100);
            }
        }
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const tooltip = document.getElementById("tooltip");
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    let newHovered = null;
    if (intersects.length > 0) {
        const first = findInteractiveParent(intersects[0].object);
        if (first) {
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

function onTouchStart(event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        startTouch = { x: touch.clientX, y: touch.clientY };
    }
}

function onTouchEnd(event) {
    if (event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const dx = Math.abs(touch.clientX - startTouch.x);
        const dy = Math.abs(touch.clientY - startTouch.y);
        if (dx < clickThreshold && dy < clickThreshold) {
            handleInteraction(touch.clientX, touch.clientY);
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

// Gameboy Modal Controls + Snake
function closeGameboyModal() {
    document.getElementById("gameboy-modal").style.display = "none";
    cancelAnimationFrame(snake.animationId);
}

function startSnakeGame() {
    const canvas = document.getElementById("snake-canvas");
    const ctx = canvas.getContext("2d");

    const gridSize = 20;
    let snake = [{ x: 5, y: 5 }];
    let dx = 1, dy = 0;
    let food = { x: 10, y: 10 };
    let running = true;

    function draw() {
        ctx.fillStyle = "#7ac143";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "black";
        snake.forEach(part => {
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
        });

        ctx.fillStyle = "red";
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    }

    function move() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        const collision = (
            head.x < 0 || head.y < 0 ||
            head.x >= canvas.width / gridSize ||
            head.y >= canvas.height / gridSize ||
            snake.some(p => p.x === head.x && p.y === head.y)
        );

        if (collision) {
            running = false;
            return closeGameboyModal();
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            food = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)),
                y: Math.floor(Math.random() * (canvas.height / gridSize))
            };
        } else {
            snake.pop();
        }
    }

    function gameLoop() {
        if (!running) return;
        move();
        draw();
        snake.animationId = requestAnimationFrame(gameLoop);
    }

    document.onkeydown = (e) => {
        switch (e.key) {
            case "ArrowUp": if (dy === 0) { dx = 0; dy = -1; } break;
            case "ArrowDown": if (dy === 0) { dx = 0; dy = 1; } break;
            case "ArrowLeft": if (dx === 0) { dx = -1; dy = 0; } break;
            case "ArrowRight": if (dx === 0) { dx = 1; dy = 0; } break;
        }
    };

    draw(); // draw initial state
    setTimeout(gameLoop, 300); // Delay to prevent immediate collision
}