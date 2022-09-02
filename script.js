let rawInputs = [];
let humanInputs = [];
let buttonsPressedThisFrame = [];
let currentLayout = "hitbox";
let syntax = "image"; // image, numpad, string
let recordingCombo = false;

let frameLeeway = 2;

let totalFrames = 0;
let framesSinceLastButton = 0;
let animationStartTime;
let currentTime = performance.now();
let timeOfLastFrame = currentTime;
let delta = 0;

let frameCap = 60;
let fpsInterval = 1000 / frameCap;

const layouts = {
    "hitbox": {
        0: {
            id: "btn5",
            map: "lk",
        },
        1: {
            id: "btn7",
            map: "mk",
        },
        2: {
            id: "btn4",
            map: "lp"
        },
        3: {
            id: "btn6",
            map: "mp",
        },
        4: {
            id: "btn10",
            map: null,
        },
        5: {
            id: "btn8",
            map: "hp",
        },
        6: {
            id: "btn11",
            map: null,
        },
        7: {
            id: "btn9",
            map: "hk",
        },
        8: {
            id: "",
        },
        9: {
            id: "",
        },
        10: {
            id: "",
        },
        11: {
            id: "",
        },
        12: {
            id: "btn3",
            map: "up",
        },
        13: {
            id: "btn1",
            map: "down",
        },
        14: {
            id: "btn0",
            map: "back",
        },
        15: {
            id: "btn2",
            map: "forward",
        },
        16: {
            id: "",
        },
    }
}

const buttons = {
    "directions": {
        "down-back": {
            string: "down-back",
            numpad: "1",
            image: "↙",
        },
        "down": {
            string: "down",
            numpad: "2",
            image: "↓",
        },
        "down-forward": {
            string: "down-forward",
            numpad: "3",
            image: "↘",
        },
        "back": {
            string: "back",
            numpad: "4",
            image: "←",
        },
        "neutral": {
            string: "neutral",
            numpad: "5",
            image: "🞅",
        },
        "forward": {
            string: "forward",
            numpad: "6",
            image: "→",
        },
        "up-back": {
            string: "up-back",
            numpad: "7",
            image: "↖",
        },
        "up": {
            string: "up",
            numpad: "8",
            image: "↑",
        },
        "up-forward": {
            string: "up-forward",
            numpad: "9",
            image: "↗",
        },
    },
    "attacks": {
        "lk": {
            string: "light kick",
            numpad: "LK",
            image: "images/attacks/lk.png"
        },
        "mk": {
            string: "medium kick",
            numpad: "MK",
            image: "images/attacks/mk.png"
        },
        "hk": {
            string: "heavy kick",
            numpad: "HK",
            image: "images/attacks/hk.png"
        },
        "lp": {
            string: "light punch",
            numpad: "LP",
            image: "images/attacks/lp.png"
        },
        "mp": {
            string: "medium punch",
            numpad: "MP",
            image: "images/attacks/mp.png"
        },
        "hp": {
            string: "heavy punch",
            numpad: "HP",
            image: "images/attacks/hp.png"
        },
    }
}

const motionInputs = {
    "forward-quarter-circle": {
        string: ["down", "down-forward", "forward"],
        numpad: "236",
        image: "images/motion-inputs/fqc.png",
    },
    "back-quarter-circle": {
        string: ["down", "down-back", "back"],
        numpad: "214",
        image: "images/motion-inputs/bqc.png",
    },
    "forward-dp": {
        string: ["forward", "down", "down-forward"],
        numpad: "623",
        image: "images/motion-inputs/fu.png",
    },
    "back-dp": {
        string: ["back", "down", "down-back"],
        numpad: "421",
        image: "images/motion-inputs/bdp.png",
    },
    "forward-half-circle": {
        string: ["back", "down-back", "down", "down-forward", "forward"],
        numpad: "41236",
        image: "images/motion-inputs/fhc.png",
    },
    "back-half-circle": {
        string: ["forward", "down-forward", "down", "down-back", "back"],
        numpad: "63214",
        image: "images/motion-inputs/bhc.png",
    },
    "hold-back-forward": {
        string: [],
        numpad: "[4]6",
        image: "images/motion-inputs/hbf.png",
    },
    "hold-down-up": {
        string: [],
        numpad: "[2]8",
        image: "images/motion-inputs/hdu.png",
    },
    "full-circle": {
        string: ["forward", "down-forward", "down", "down-back", "back", "up-back", "up", "up-forward", "up"],
        numpad: "360",
        image: "images/motion-inputs/fc.png",
    },
}



window.addEventListener("gamepadconnected", e => {
    console.log(e.gamepad);
    lastGamepadButtonState = e.gamepad.buttons;
    animationStartTime = performance.now();
    gamepadLoop();
});

function gamepadLoop() {

    requestAnimationFrame(gamepadLoop);
    updateDelta();
    
    if (delta > fpsInterval) {
        totalFrames++;
        timeOfLastFrame = currentTime;
        updateFPSCounter();

        let buttonsPressedLastFrame = [...buttonsPressedThisFrame];
        buttonsPressedThisFrame = [];
        const gamepads = navigator.getGamepads();

        // Early exit if we have no gamepads
        if (!gamepads.length) return;
        const gp1 = gamepads[0];

        let newButtonPresses = [];
        gp1.buttons.forEach((button, index) => {
            if (button.pressed && !buttonsPressedLastFrame.includes(index)) {
                newButtonPresses.push(index);
            }
            if (button.pressed) {
                buttonsPressedThisFrame.push(index);
            }
        });
        
        // If we have a change in buttons since last frame
        if (JSON.stringify(buttonsPressedLastFrame) !== JSON.stringify(buttonsPressedThisFrame)) {
            let newButtonPresses = buttonsPressedThisFrame.filter(button => !buttonsPressedLastFrame.includes(button));
            let buttonsLetGo = buttonsPressedLastFrame.filter(button => !buttonsPressedThisFrame.includes(button));
            let nonDirectionalButtons = newButtonPresses.filter(button => !isDirectional(button));
            let directionalButtonChanges = [...buttonsLetGo.filter(button => isDirectional(button)), ...newButtonPresses.filter(button => isDirectional(button))];

            let newHumanInputs = [];

            // If any of our directional buttons have changed,
            // reevaluate our input
            if (directionalButtonChanges.length > 0) {
                let directionalInput = parseDirectionalInput(buttonsPressedThisFrame.filter(button => isDirectional(button)));
                if (directionalInput) {
                    newHumanInputs.push(directionalInput);
                }
            }

            // If attacks are NEW button presses, evaluate if directional buttons are being held
            let newAttacks = parseAttackInputs(nonDirectionalButtons)
            if (newAttacks) {
                humanInputs.push(...newAttacks);
                newHumanInputs.push(...newAttacks);
                // Check if we have directionals that we need to add
                // Only check directionals if there were no directional button changes this frame
                if (directionalButtonChanges.length === 0) {
                    let directionalInput = parseDirectionalInput(buttonsPressedThisFrame.filter(button => isDirectional(button)));
                    if (directionalInput) {
                        newHumanInputs.push(directionalInput);
                    }
                }
            }

            humanInputs.push(newHumanInputs);
            createHumanInputElement(newHumanInputs);
            // newHumanInputs.map(input => createHumanInputElement(input));

            // Update the model controller render
            updateControllerModel(newButtonPresses, buttonsLetGo);
        }
        framesSinceLastButton++;
        rawInputs.push(...newButtonPresses);
    }
}

function isDirectional(button) {
    return ["up", "down", "back", "forward"].includes(layouts[currentLayout][button].map);
}

function isMapped(button) {
    return layouts[currentLayout][button].map ? true : false;
}

function parseDirectionalInput(buttons) {
    let buttonUnmapped = buttons.some(button => !layouts[currentLayout][button].map)
    if (buttonUnmapped) return;
    let direction;
    // If we have more than one button, determine what direction we are pressing
    if (buttons.length > 1) {
        direction = `${layouts[currentLayout][buttons[0]].map}-${layouts[currentLayout][buttons[1]].map}`;
    } else if (buttons.length == 1) {
        direction = layouts[currentLayout][buttons[0]].map;
    }
    if (direction) return {type: 'directions', input: direction};
}

function parseAttackInputs(buttons) {
    let buttonUnmapped = buttons.some(button => !layouts[currentLayout][button].map)
    if (buttonUnmapped) return;
    return buttons.map(button => {
        return {type: 'attacks', input: layouts[currentLayout][button].map}
    })
}

function createHumanInputElement(inputs) {
    if (inputs.length < 1) return;

    const inputHolder = document.getElementById("humanInput");
    const inputEl = document.createElement("div");
    inputEl.classList.add("input");

    
    inputs.forEach(input => {
        if (syntax === "image" && input.type === "attacks") {
            const div = document.createElement("div");
            const image = document.createElement("img");
            image.src = buttons[input.type][input.input][syntax];
            div.appendChild(image);
            inputEl.appendChild(div);
        } else {
            const div = document.createElement("div");
            div.innerHTML = `${buttons[input.type][input.input][syntax]}`;
            if (input.type === "directions") {
                inputEl.prepend(div);
            } else {
                inputEl.appendChild(div);
            }
        }
    });

    inputHolder.prepend(inputEl);
}

function changeModelButtonState(buttons, depress) {
    buttons.forEach(button => {
        if (!layouts[currentLayout][button].id) return;
        let buttonEl = document.getElementById(layouts[currentLayout][button].id);
        if (depress) {
            buttonEl.classList.add('btn-depressed')
        } else {
            buttonEl.classList.remove('btn-depressed')
        }
    })
}

function updateControllerModel(newButtonPresses, buttonsLetGo) {
    if (newButtonPresses.length > 0) {
        changeModelButtonState(newButtonPresses, true);
    }

    if (buttonsLetGo.length > 0) {
        changeModelButtonState(buttonsLetGo, false);
    }
}

function clearHumanInput() {
    const inputHolder = document.getElementById("humanInput");
    inputHolder.innerHTML = "";
}

function updateFPSCounter() {
    document.getElementById('fpsCounter').innerHTML = Math.round(1000 / delta * 100) / 100;
}

function updateDelta() {
    currentTime = performance.now();
    delta = currentTime - timeOfLastFrame;
}
