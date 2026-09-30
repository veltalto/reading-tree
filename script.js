/**
 * Reading Tree - Main Application Logic
 */

// --- Constants & Config ---
const CONFIG = {
    EXP_BASE: 100, // Base exp to level up logic
    LEVEL_SEED_MAX: 1,   // 種: Lv.1
    LEVEL_SPROUT_MIN: 2, // 芽: Lv.2〜5
    LEVEL_SPROUT_MAX: 5,
    LEVEL_TREE_MIN: 6,   // 木: Lv.6〜20
    LEVEL_MAX: 20,       // MAX レベル
};

// --- Custom Tree Visual Definitions ---
const VISUAL_THEMES = [
    { id: "sakura", name: "静かな緑", leaf1: "#2d7c41", leaf2: "#318d6a" },
    { id: "lemon", name: "明るい緑", leaf1: "#99ee78", leaf2: "#73c20c" },
    { id: "forest", name: "フォレストグリーン", leaf1: "#a8e6cf", leaf2: "#56ab2f" },
    { id: "mint", name: "深い緑", leaf1: "#208628", leaf2: "#32b966" },
    { id: "lavender", name: "エメラルドグリーン", leaf1: "#4b9982", leaf2: "#2adf93" },
    { id: "autumn", name: "秋っぽい緑", leaf1: "#9ed33c", leaf2: "#c0cf33" }
];

const DECORATOR_TYPES = [
    { type: "apple",   color: "#e74c3c" },   // リンゴ
    { type: "orange",  color: "#f39c12" },   // オレンジ
    { type: "cherry",  color: "#c0392b" },   // サクランボ
    { type: "peach",   color: "#ffb7c5" },   // 桃
    { type: "lemon",   color: "#f9e04b" }    // レモン
];

const GROUND_COLOR = "#6d4c41"; // 地面の色（茶色固定）

let sproutBurstQueued = false;
let treeBurstQueued = false;

function getDefaultVisuals() {
    return {
        themeId: "forest",
        leafColor: "#a8e6cf",
        leafColorGrad: "#56ab2f",
        decoratorType: "daisy",
        decoratorColor: "#ffffff",
        potColor: GROUND_COLOR
    };
}

function generateRandomVisuals() {
    const theme = VISUAL_THEMES[Math.floor(Math.random() * VISUAL_THEMES.length)];
    const dec = DECORATOR_TYPES[Math.floor(Math.random() * DECORATOR_TYPES.length)];
    const pot = GROUND_COLOR;
    return {
        themeId: theme.id,
        leafColor: theme.leaf1,
        leafColorGrad: theme.leaf2,
        decoratorType: dec.type,
        decoratorColor: dec.color,
        potColor: pot
    };
}

function adjustColorBrightness(hex, percent) {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
}

function drawDecorators(group, type, color, count) {
    // 6 fixed cute positions inside the crown
    const positions = [
        { x: 50, y: 24 },
        { x: 35, y: 35 },
        { x: 65, y: 35 },
        { x: 28, y: 48 },
        { x: 72, y: 48 },
        { x: 50, y: 48 }
    ];

    const countToDraw = Math.min(count, positions.length);

    for (let i = 0; i < countToDraw; i++) {
        const { x, y } = positions[i];

        if (type === 'apple') {
            // リンゴ: 丸い実＋葉っぱ
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4.5);
            circle.setAttribute('fill', color);
            circle.setAttribute('class', 'tree-decorator-item');
            group.appendChild(circle);

            const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            leaf.setAttribute('d', `M${x},${y-4.5} Q${x+3},${y-8.5} ${x+2},${y-10} Q${x-1},${y-8} ${x},${y-4.5}`);
            leaf.setAttribute('fill', '#2ecc71');
            leaf.setAttribute('class', 'tree-decorator-item');
            group.appendChild(leaf);

        } else if (type === 'orange') {
            // オレンジ: 丸い実＋へたのドット
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4.5);
            circle.setAttribute('fill', color);
            circle.setAttribute('class', 'tree-decorator-item');
            group.appendChild(circle);

            // 表面のテクスチャライン
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line1.setAttribute('d', `M${x-3},${y} Q${x},${y-3} ${x+3},${y}`);
            line1.setAttribute('fill', 'none');
            line1.setAttribute('stroke', '#e67e22');
            line1.setAttribute('stroke-width', '0.7');
            line1.setAttribute('opacity', '0.6');
            line1.setAttribute('class', 'tree-decorator-item');
            group.appendChild(line1);

            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x);
            dot.setAttribute('cy', y-4.5);
            dot.setAttribute('r', 0.8);
            dot.setAttribute('fill', '#8d6e63');
            dot.setAttribute('class', 'tree-decorator-item');
            group.appendChild(dot);

        } else if (type === 'cherry') {
            // サクランボ: 実が下・茎が上（逆向き）
            const stem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            stem.setAttribute('d', `M${x-3},${y} Q${x-2},${y-5} ${x},${y-7} M${x+3},${y} Q${x+2},${y-5} ${x},${y-7}`);
            stem.setAttribute('fill', 'none');
            stem.setAttribute('stroke', '#5d4037');
            stem.setAttribute('stroke-width', '1');
            stem.setAttribute('stroke-linecap', 'round');
            stem.setAttribute('class', 'tree-decorator-item');
            group.appendChild(stem);

            // 葉っぱ（茎の先端から）
            const cherryLeaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            cherryLeaf.setAttribute('d', `M${x},${y-7} Q${x+4},${y-9} ${x+4},${y-11} Q${x+1},${y-10} ${x},${y-7}`);
            cherryLeaf.setAttribute('fill', '#2ecc71');
            cherryLeaf.setAttribute('class', 'tree-decorator-item');
            group.appendChild(cherryLeaf);

            // 実（左）
            const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c1.setAttribute('cx', x - 3);
            c1.setAttribute('cy', y + 3);
            c1.setAttribute('r', 3);
            c1.setAttribute('fill', color);
            c1.setAttribute('class', 'tree-decorator-item');
            group.appendChild(c1);

            // 実（右）
            const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c2.setAttribute('cx', x + 3);
            c2.setAttribute('cy', y + 3);
            c2.setAttribute('r', 3);
            c2.setAttribute('fill', color);
            c2.setAttribute('class', 'tree-decorator-item');
            group.appendChild(c2);

            // ハイライト
            const h1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            h1.setAttribute('cx', x - 4);
            h1.setAttribute('cy', y + 1.5);
            h1.setAttribute('r', 1);
            h1.setAttribute('fill', '#ffffff');
            h1.setAttribute('opacity', '0.5');
            h1.setAttribute('class', 'tree-decorator-item');
            group.appendChild(h1);

        } else if (type === 'peach') {
            // 桃: 全体的に丸く、下部中央にくぼみのある桃らしい形
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'tree-decorator-item');

            // 実の本体: 横広・扁平（案2）、他フルーツと同等サイズに縮小
            const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const bd = `M${x},${y-5} C${x-6},${y-5} ${x-7},${y+1} ${x-5},${y+4} C${x-3},${y+7} ${x+3},${y+7} ${x+5},${y+4} C${x+7},${y+1} ${x+6},${y-5} ${x},${y-5} Z`;
            body.setAttribute('d', bd);
            body.setAttribute('fill', color);
            g.appendChild(body);

            // 縦の溝
            const groove = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            groove.setAttribute('d', `M${x},${y-5} Q${x+0.4},${y} ${x},${y+6}`);
            groove.setAttribute('fill', 'none');
            groove.setAttribute('stroke', '#d4849a');
            groove.setAttribute('stroke-width', '0.8');
            groove.setAttribute('opacity', '0.55');
            g.appendChild(groove);

            // ハイライト（左上の光沢）
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            highlight.setAttribute('cx', x - 2);
            highlight.setAttribute('cy', y - 2);
            highlight.setAttribute('rx', '1.5');
            highlight.setAttribute('ry', '1');
            highlight.setAttribute('fill', '#ffffff');
            highlight.setAttribute('opacity', '0.35');
            g.appendChild(highlight);

            // 茎
            const peachStem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            peachStem.setAttribute('d', `M${x},${y-5} Q${x+0.8},${y-7} ${x+0.5},${y-9}`);
            peachStem.setAttribute('fill', 'none');
            peachStem.setAttribute('stroke', '#6d4c41');
            peachStem.setAttribute('stroke-width', '1');
            peachStem.setAttribute('stroke-linecap', 'round');
            g.appendChild(peachStem);

            // 葉っぱ
            const peachLeaf = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            peachLeaf.setAttribute('d', `M${x+0.5},${y-8} Q${x+4},${y-10} ${x+4},${y-12} Q${x+1},${y-11} ${x+0.5},${y-8}`);
            peachLeaf.setAttribute('fill', '#388e3c');
            g.appendChild(peachLeaf);

            group.appendChild(g);

        } else if (type === 'lemon') {
            // レモン: 楕円形の実＋両端のとがり
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'tree-decorator-item');

            // 実の本体（楕円）
            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            ellipse.setAttribute('cx', x);
            ellipse.setAttribute('cy', y);
            ellipse.setAttribute('rx', '5');
            ellipse.setAttribute('ry', '3.5');
            ellipse.setAttribute('fill', color);
            g.appendChild(ellipse);

            // 両端のとがり
            const tip1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tip1.setAttribute('d', `M${x-5},${y} Q${x-7},${y-1} ${x-6.5},${y} Q${x-7},${y+1} ${x-5},${y}`);
            tip1.setAttribute('fill', color);
            g.appendChild(tip1);

            const tip2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tip2.setAttribute('d', `M${x+5},${y} Q${x+7},${y-1} ${x+6.5},${y} Q${x+7},${y+1} ${x+5},${y}`);
            tip2.setAttribute('fill', color);
            g.appendChild(tip2);

            // ハイライト
            const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            highlight.setAttribute('cx', x - 1.5);
            highlight.setAttribute('cy', y - 1);
            highlight.setAttribute('rx', '1.8');
            highlight.setAttribute('ry', '1');
            highlight.setAttribute('fill', '#ffffff');
            highlight.setAttribute('opacity', '0.4');
            g.appendChild(highlight);

            group.appendChild(g);
        }
    }
}

function applyTreeVisuals(visuals, level, svgContainer) {
    if (!visuals || !visuals.potColor || !visuals.leafColor || !visuals.leafColorGrad) {
        visuals = getDefaultVisuals();
    }

    // 1. Update Grounds（茶色一色で固定）
    const grounds = svgContainer.querySelectorAll('.tree-ground');
    grounds.forEach(ground => {
        const svg = ground.closest('svg');
        if (svg) {
            const stop1 = svg.querySelector('.ground-color-stop1');
            const stop2 = svg.querySelector('.ground-color-stop2');
            if (stop1 && stop2) {
                stop1.setAttribute('stop-color', GROUND_COLOR);
                stop2.setAttribute('stop-color', GROUND_COLOR);
            }
        }
    });

    // 2. Update Crown colors (only for adult tree)
    const crownLight = svgContainer.querySelector('#crown-stop-light');
    const crownDark = svgContainer.querySelector('#crown-stop-dark');
    if (crownLight && crownDark) {
        crownLight.setAttribute('stop-color', visuals.leafColor);
        crownDark.setAttribute('stop-color', visuals.leafColorGrad);
    }

    // 3. Update Decorators
    const decoratorsGroup = svgContainer.querySelector('.tree-decorators');
    if (decoratorsGroup) {
        decoratorsGroup.innerHTML = '';
        if (level >= CONFIG.LEVEL_TREE_MIN) {
            // 木になってからレベルに応じてフルーツが増える
            // MAXレベル（一回読み切り到達）は4個固定
            let count = 2;
            if (level >= CONFIG.LEVEL_TREE_MIN + 2) count = 4;
            if (level >= CONFIG.LEVEL_TREE_MIN + 4) count = 6;
            if (level >= CONFIG.LEVEL_MAX) count = 4;

            drawDecorators(decoratorsGroup, visuals.decoratorType, visuals.decoratorColor, count);
        }
    }
}

function createMiniatureTreeSvg(visuals, id) {
    if (!visuals) visuals = getDefaultVisuals();
    const gradId = `mini-crown-grad-${id}`;

    // Dry-run decorator generation
    let decoratorsHtml = '';
    const tempGroup = {
        appendChild: function(el) {
            const outer = document.createElement('div');
            outer.appendChild(el);
            decoratorsHtml += outer.innerHTML;
        }
    };
    // Draw 4 decorators for the completed miniature preview
    drawDecorators(tempGroup, visuals.decoratorType, visuals.decoratorColor, 4);

    return `
        <svg viewBox="0 0 120 140">
            <defs>
                <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${visuals.leafColor}" />
                    <stop offset="100%" stop-color="${visuals.leafColorGrad}" />
                </linearGradient>
            </defs>
            <ellipse cx="60" cy="120" rx="45" ry="10" fill="#e2e8f0" />
            <!-- Ground Hill -->
            <path d="M15,115 Q60,95 105,115 L100,132 Q60,135 20,132 Z" fill="${GROUND_COLOR}" />
            <ellipse cx="60" cy="112" rx="18" ry="4" fill="#5D4037" />
            <g>
                <path d="M54,112 L55,65 Q50,60 45,55 Q55,50 60,65 L66,112 Z" fill="#5D4037" />
                <path d="M55,68 Q40,60 38,50 Q45,52 52,62 Z" fill="#5D4037" />
                <path d="M60,66 Q72,60 78,52 Q72,55 62,62 Z" fill="#5D4037" />
                <path d="M35,65 C20,65 15,45 25,35 C15,20 35,10 50,20 C65,10 85,20 75,35 C85,45 80,65 65,65 C60,72 40,72 35,65 Z" fill="url(#${gradId})" />
                <path d="M38,55 C28,55 25,42 32,35 C28,26 40,18 50,26 C60,18 72,26 68,35 C75,42 72,55 62,55 Z" fill="#ffffff" opacity="0.12" />
                <g>${decoratorsHtml}</g>
            </g>
        </svg>
    `;
}

// --- State Management ---

const state = {
    level: 1,
    currentExp: 0,
    leaves: [],
    lastLogin: new Date().toDateString(),
    isFirstTime: true,
    supporterId: 0, // 0:すず 1:みどり 2:そら 3:ぽち
    currentBookTitle: "",
    totalBookPages: null,
    currentBookReadPages: 0,
    completedBooks: [],
    treeVisuals: null,

    // Session State
    isReading: false,
    sessionMode: 'time', // or 'pages'
    sessionTarget: 30, // mins or pages
    sessionStartTime: null,
    elapsedSeconds: 0,
    timerInterval: null
};

// --- Supporter Image Map ---
const SUPPORTER_MAP = [
    {
        id: 0, name: 'ツリーさん',
        idle: 'assets/supporter.png', reading: 'assets/ツリー2.png',
        // おっとり・丁寧な口調
        messages: [
            "来てくださってありがとうございます",
            "読書は発想力を育ててくれますよ",
            "今日はどんな本を読まれますか？",
            "一ページでも読んでみませんか？",
            "今日も素敵な一日になりますよ",
            "読書は心の栄養になりますから"
        ],
        tutorial: [
            "はじめまして！\n私はあなたのサポーター、ツリーです。",
            "ここは、Read tree。\nあなたにはこれから読書をしていただき、\n種を木へと育てていただきます。",
            "このアプリゲームでは、\nあなたに読みたい本を読んでいただき、\n記録してもらいます。",
            "読書をすることで、\n種が成長するためのEXPが入手できますよ。",
            "また、一回読むごとに葉っぱが生まれます。",
            "葉っぱの枚数が、本を読んだ回数になっていますよ！",
            "沢山本を読んだり、本を読み終えると木に何か変化が起こるかもしれません。",
            "ぜひ、本を読んでみてくださいね！",
            "それでは、いってらっしゃ…あ、",
            "言い忘れていました。\n1冊の本を読み終えるまでが1つのサイクルです。",
            "それでは、改めて、\nいってらっしゃいませ"
        ],
        completedMessage: (title) => `「${title}」を読み終えましたね。おめでとうございます！新しい種を植える準備ができましたら「新しい種を植える」ボタンを押してくださいね。`,
        interruptMessage: "⚠️ 読書が中断されました！\n時間は一時停止しています。ツリーさんが待っていますよ。\n再開するにはOKを押してください。"
    },
    {
        id: 1, name: 'リーフさん',
        idle: 'assets/sup2-1.png', reading: 'assets/リーフ2.png',
        // クール・女性的な口調「〜わ」「〜になっているわ」
        messages: [
            "来てくれたのね",
            "読書は思考を鍛えるわ",
            "今日はどの本にするの？",
            "一ページだけでも読んでみてね",
            "今日もいい一日になるわ",
            "読書は、力になるものよ"
        ],
        tutorial: [
            "はじめまして。\n私がリーフさんよ。サポーターをするわ。",
            "ここはRead tree。\nあなたには読書をしてもらって、\n種を木へと育ててもらうわ。",
            "このアプリゲームではね、\n読みたい本を読んで、\n記録してもらうことになっているわ。",
            "読書をすることで、\n種が育つEXPが手に入るようになっているわ。",
            "また、1回読むごとに葉っぱが生まれるの。",
            "葉っぱの枚数が、読んだ回数になっているわ",
            "沢山読んだり、読み終えると木に変化が起きるかもね。",
            "ぜひ読んでみてね。",
            "それじゃあ、いってらっしゃ…あ、",
            "言い忘れていたわ。\n1冊読み終えるまでが1サイクルになっているの。",
            "改めて、いってらっしゃい"
        ],
        completedMessage: (title) => `「${title}」を読み終えたのね。おめでとう！新しい種を植えるなら「新しい種を植える」ボタンを押してね。`,
        interruptMessage: "⚠️ 読書が中断されたわ！\n時間は止まっているわ。さみしいわ。\n再開するにはOKを押してね。"
    },
    {
        id: 2, name: 'たいよう',
        idle: 'assets/sup3-1.png', reading: 'assets/たいよう2.png',
        // 元気・テンション高め
        messages: [
            "きてくれてありがとう！！",
            "読書で発想力アップだ！",
            "今日はどんな本を読む？！",
            "一ページだけでも読もうぜ！",
            "今日もいい一日にしような！",
            "読書って最高だよな！！"
        ],
        tutorial: [
            "はじめまして！！\nぼくは、たいよう！サポーターだぜ！！",
            "ここはRead tree！\nいっしょに読書して、\n種を大きな木に育ててくれ！",
            "このゲームでは、\n読みたい本を読んで、\n記録してもらうんだ！",
            "読書するとEXPがもらえて、\n種がぐんぐん育つぜ！",
            "あと、1回読むたびに葉っぱが増えるんだ！",
            "葉っぱの枚数が読んだ回数になってるよ！すごいよな！",
            "いっぱい読んだり、読み終えると木にいいことが起きるかも！",
            "ぜひ読んでみてくれ！！",
            "それじゃ、いってらっしゃ…あ！！",
            "言い忘れてた！\n1冊読み終えるまでが1サイクルだぜ！",
            "改めて、いってらっしゃい！！応援しているぞ！！"
        ],
        completedMessage: (title) => `「${title}」読み終えたか！！すごいぞ！おめでとう！！新しい種を植えるなら「新しい種を植える」ボタンを押してくれ！`,
        interruptMessage: "⚠️ 読書が中断されちゃった！\n時間は止まってるよ。たいようが待ってるぞ！\n再開するにはOKを押してね！"
    },
    {
        id: 3, name: 'ぽー太',
        idle: 'assets/sup4-1.png', reading: 'assets/2.png',
        // ゆるめ・語尾「〜な」「〜してね」
        messages: [
            "きてくれたな〜",
            "本を読むのは楽しいよな～",
            "今日はどの本にするか～？",
            "ちょっとだけ読んでみてね～",
            "今日もいい一日にしてね～",
            "本はたからものだよな〜"
        ],
        tutorial: [
            "はじめましてな〜。\nぽー太だよ～！サポーターだよ～。",
            "ここはRead tree。\nいっしょに読書して、\n種を木にそだてていこうな～。",
            "このゲームではな、\n読みたい本を読んで、\n記録してねってかんじだよ～。",
            "読書するとEXPがもらえてな、\n種がそだっていくんだよ～。",
            "1回読むたびに葉っぱがふえるよ～。",
            "葉っぱの数が読んだ回数になっているよ～！",
            "いっぱい読んだり、読み終わると木にいいことが起きるかもな〜。",
            "ぜひ読んでみてね〜！",
            "それじゃあ、いってらっしゃ…あ、",
            "言い忘れてたな。\n1冊読み終わるまでが1サイクルだよ～。",
            "あらためて、いってらっしゃいな〜"
        ],
        completedMessage: (title) => `「${title}」読み終わったな〜！すごいよ！新しい種を植えるなら「新しい種を植える」ボタンを押してね。`,
        interruptMessage: "⚠️ 読書がちゅうだんされたな！\n時間はとまっているよ。ぽー太、さみしいな。\n再開するにはOKを押してね。"
    },
];

function generateReadingLeaves() {
    const container = document.getElementById('reading-leaves');
    if (!container) return;
    container.innerHTML = '';

    const count = Math.floor(Math.random() * 4) + 5; // 5〜8枚

    // キャラが中央に表示されるため、中央エリアを避けるゾーンを定義
    // 横: 25〜75%、縦: 25〜65% はキャラ領域なので除外
    const zones = [
        { xMin: 3,  xMax: 22, yMin: 5,  yMax: 90 }, // 左端
        { xMin: 78, xMax: 97, yMin: 5,  yMax: 90 }, // 右端
        { xMin: 22, xMax: 78, yMin: 5,  yMax: 22 }, // 上
        { xMin: 22, xMax: 78, yMin: 72, yMax: 90 }, // 下
    ];

    for (let i = 0; i < count; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'home-leaf reading-leaf-item';

        // ゾーンをランダムに選択して配置
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const leftPos = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
        const topPos  = zone.yMin + Math.random() * (zone.yMax - zone.yMin);

        leaf.style.left = `${leftPos}%`;
        leaf.style.top  = `${topPos}%`;

        const rot = -45 + (Math.random() * 60 - 30);
        leaf.style.transform = `rotate(${rot}deg)`;

        container.appendChild(leaf);
    }
}

function getSupporter() {
    return SUPPORTER_MAP[state.supporterId] || SUPPORTER_MAP[0];
}

function applySupporter(id) {
    const s = SUPPORTER_MAP[id] || SUPPORTER_MAP[0];
    const idleImg = document.querySelector('.supporter-img');
    const readingImg = document.getElementById('reading-supporter-img') || document.querySelector('.supporter-img-reading');
    if (idleImg) idleImg.src = s.idle;
    if (readingImg) readingImg.src = s.reading;
}

// --- Audio (BGM & SE) ---
const bgm = new Audio('assets/assetsbgm.mp3');
bgm.loop = true;
bgm.load();

// --- SE: Audio オブジェクト方式（確実再生）---
const seTap     = new Audio('assets/se_tap.mp3');
const seTalk    = new Audio('assets/se_talk.mp3');
const seLevelUp = new Audio('assets/se_levelup.mp3');
const seExp     = new Audio('assets/se_exp.mp3');

[seTap, seTalk, seLevelUp, seExp].forEach(a => {
    a.preload = 'auto';
    a.volume  = 0.6;
    a.load();
});

// アンロック済みフラグ
let _audioUnlocked = false;

function _unlockAllAudio() {
    if (_audioUnlocked) return;
    _audioUnlocked = true;
    [seTap, seTalk, seLevelUp, seExp].forEach(a => {
        const v = a.volume;
        a.volume = 0;
        a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = v; })
                 .catch(() => { a.volume = v; });
    });
    bgm.play().then(() => { bgm.pause(); bgm.currentTime = 0; }).catch(() => {});
}

// 初回タッチ・クリックでアンロック
document.addEventListener('touchstart', _unlockAllAudio, { once: true, passive: true });
document.addEventListener('click',      _unlockAllAudio, { once: true });

function playSe(audio) {
    if (!audio) return;
    const play = () => {
        try {
            audio.currentTime = 0;
            audio.volume = 0.6;
            audio.play().catch(() => {});
        } catch(e) {}
    };
    if (_audioUnlocked) {
        play();
    } else {
        // 未アンロックの場合はアンロック後に再生
        _unlockAllAudio();
        setTimeout(play, 80);
    }
}

// --- DOM Elements ---
const elements = {
    // Game
    levelDisplay: document.getElementById('level-display'),
    nextLevelExp: document.getElementById('next-level-exp'),
    expBar: document.getElementById('exp-bar'),
    welcomeMessage: document.getElementById('welcome-message'),
    messageArea: document.getElementById('main-message-area'),
    treeContainer: document.getElementById('tree-container'),
    mainTree: document.getElementById('main-tree'),
    btnStart: document.getElementById('start-task-btn'),
    btnRecords: document.getElementById('show-records-btn'),
    header: document.getElementById('main-header'),

    // Intro
    introLayer: document.getElementById('intro-layer'),
    introStartBtn: document.getElementById('intro-start-btn'),
    introDialogue: document.getElementById('intro-dialogue'),
    introText: document.getElementById('intro-text'),
    introMusicToggle: document.getElementById('intro-music-toggle'),

    // Book Setup Modal
    modalBookSetup: document.getElementById('book-setup-modal'),
    inputBookTotalPages: document.getElementById('book-total-pages-input'),
    btnStartBook: document.getElementById('start-book-btn'),
    btnCancelBookSetup: document.getElementById('cancel-book-setup-btn'),

    // Concentration Modal
    modalSetup: document.getElementById('concentration-setup'),
    tabTime: document.querySelector('.tab-btn[data-target="time"]'),
    tabPages: document.querySelector('.tab-btn[data-target="pages"]'),
    panelTime: document.getElementById('setup-time'),
    panelPages: document.getElementById('setup-pages'),
    inputTime: document.getElementById('target-time-input'),
    inputPages: document.getElementById('target-pages-input'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    btnCancelSetup: document.getElementById('cancel-setup-btn'),
    btnStartSession: document.getElementById('start-session-btn'),

    // Concentration Active
    concentrationLayer: document.getElementById('concentration-mode'),
    sessionTimer: document.getElementById('session-timer'),
    btnStopSession: document.getElementById('stop-session-btn'),

    // Result Modal
    modalResult: document.getElementById('result-modal'),
    inputResultPages: document.getElementById('result-pages'),
    inputResultNote: document.getElementById('result-note'),
    btnSaveResult: document.getElementById('save-result-btn'),
    rewardPreview: document.getElementById('reward-preview'),
    rewardExp: document.getElementById('reward-exp'),
};

// --- Concentration Mode ---

function openSetupModal() {
    elements.modalSetup.classList.remove('hidden');
}

function startSession() {
    // Determine mode from UI state
    const pageTab = document.querySelector('.tab-btn[data-target="pages"]');
    const isPageMode = pageTab && pageTab.classList.contains('active');

    state.sessionMode = isPageMode ? 'pages' : 'time';

    if (state.sessionMode === 'time') {
        state.sessionTarget = parseInt(elements.inputTime.value, 10) || 30;
    } else {
        const targetPages = parseInt(elements.inputPages.value, 10) || 0;
        if (targetPages <= 0) {
            alert("目標ページ数は1ページ以上を入力してください。");
            return;
        }

        // 残りのページ数を計算してバリデーション
        const remainingPages = state.totalBookPages - state.currentBookReadPages;
        if (targetPages > remainingPages) {
            alert(`目標ページ数が残りのページ数（残り ${remainingPages} ページ）を超えています。`);
            return;
        }

        state.sessionTarget = targetPages;
    }

    elements.modalSetup.classList.add('hidden');
    state.isReading = true;
    state.sessionStartTime = Date.now();
    state.elapsedSeconds = 0;

    elements.concentrationLayer.classList.remove('hidden');
    elements.header.classList.add('hidden');
    const changeBtn = document.getElementById('change-supporter-btn');
    if (changeBtn) changeBtn.style.display = 'none';
    applySupporter(state.supporterId || 0);
    generateReadingLeaves();

    updateTimerDisplay();
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopSession() {
    clearInterval(state.timerInterval);
    state.isReading = false;
    finishSession(); // Proceed to Result
}

// Timer and Lock helpers
function updateTimerDisplay() {
    elements.sessionTimer.textContent = formatTime(state.elapsedSeconds);
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function setupFocusLock() {
    document.addEventListener('visibilitychange', () => {
        if (!state.isReading) return;

        if (document.hidden) {
            if (state.timerInterval) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
            }
        } else {
            alert(getSupporter().interruptMessage);

            if (!state.timerInterval) {
                state.timerInterval = setInterval(() => {
                    state.elapsedSeconds++;
                    updateTimerDisplay();
                }, 1000);
            }
        }
    });

    window.addEventListener('beforeunload', (e) => {
        if (state.isReading) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// --- Result & Growth Logic ---

function finishSession() {
    elements.concentrationLayer.classList.add('hidden');
    elements.modalResult.classList.remove('hidden');

    if (state.sessionMode === 'pages') {
        if (elements.inputResultPages) elements.inputResultPages.value = state.sessionTarget || '';
    } else {
        if (elements.inputResultPages) elements.inputResultPages.value = '';
    }

    if (elements.inputResultNote) elements.inputResultNote.value = '';
}

function saveResult() {
    if (!elements.inputResultPages) {
        alert("エラー: 入力欄が見つかりません。");
        return;
    }

    const pages = parseInt(elements.inputResultPages.value, 10) || 0;
    const note = elements.inputResultNote ? elements.inputResultNote.value : '';
    const minutes = Math.floor(state.elapsedSeconds / 60);

    if (pages < 0) {
        alert("読んだページ数は0以上を入力してください。");
        return;
    }

    // 残りのページ数を計算してバリデーション
    const remainingPages = state.totalBookPages - state.currentBookReadPages;
    if (pages > remainingPages) {
        alert(`読んだページ数が残りのページ数（残り ${remainingPages} ページ）を超えています。`);
        return;
    }

    // 通常の獲得EXP
    const normalExp = (minutes * 10) + (pages * 5);
    let expGain = normalExp;
    let hasCompletionBonus = false;

    // 今回の記録で読了に達するかチェック
    const willComplete = state.totalBookPages && (state.currentBookReadPages + pages >= state.totalBookPages);
    // 1回のセッションで最初から最後まで読み切ったか
    const isOneSession = willComplete && state.currentBookReadPages === 0;

    if (isOneSession) {
        // 一回で読み切り → 強制 MAX レベル
        state.level = CONFIG.LEVEL_MAX;
        state.currentExp = 0;
        hasCompletionBonus = true;
        expGain = 0;
    } else if (willComplete) {
        // 通常読了ボーナス: Lv.6（木）到達を保証
        let currentTotalExp = state.currentExp;
        for (let l = 1; l < state.level; l++) {
            currentTotalExp += l * CONFIG.EXP_BASE;
        }
        const expectedTotalExp = currentTotalExp + normalExp;
        const targetTotalExp = 1500;
        if (expectedTotalExp < targetTotalExp) {
            expGain += targetTotalExp - expectedTotalExp;
            hasCompletionBonus = true;
        }
    }

    state.currentExp += expGain;
    state.currentBookReadPages += pages;

    if (!isOneSession) checkLevelUp();

    const newLeaf = {
        id: Date.now(),
        date: new Date().toISOString(),
        pages: pages,
        note: note,
        exp: expGain
    };
    state.leaves.push(newLeaf);

    saveState();

    playSe(seExp);

    let alertMsg = `記録完了！\nEXP +${expGain}\n葉っぱが生まれました！\n(現在 ${state.currentBookReadPages} / ${state.totalBookPages} ページ)`;
    if (isOneSession) {
        alertMsg = `🏆 一冊を一気に読み切りました！\nMAX レベル Lv.${CONFIG.LEVEL_MAX} に到達！\n立派な木が育ちました！`;
        treeBurstQueued = true;
    } else if (willComplete && hasCompletionBonus) {
        alertMsg = `📖 本を読み終えました！読了ボーナスEXP（+${expGain - normalExp}）が加算されました！\n記録完了！\nEXP +${expGain}\n葉っぱが生まれました！`;
    } else if (willComplete) {
        alertMsg = `📖 本を読み終えました！おめでとうございます！\n記録完了！\nEXP +${expGain}\n葉っぱが生まれました！`;
    }
    alert(alertMsg);

    showMainGame();
}

// --- Core Logic ---

function init() {
    loadState();
    startIntro(); // Always show Title Screen

    setupEventListeners();
    setupFocusLock();
}

function loadState() {
    const saved = localStorage.getItem('readingTreeState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state, parsed);
        // Ensure arrays are initialized if loading old save data
        if (!state.completedBooks) {
            state.completedBooks = [];
        }
        if (!state.currentBookTitle) {
            state.currentBookTitle = "";
        }
        if (!state.treeVisuals) {
            state.treeVisuals = getDefaultVisuals();
        }
        if (state.supporterId === undefined || state.supporterId === null) {
            state.supporterId = 0;
        }
        state.isReading = false;
        state.timerInterval = null;
    } else {
        // First initialization
        state.treeVisuals = getDefaultVisuals();
    }
}

function saveState() {
    const persistent = {
        level: state.level,
        currentExp: state.currentExp,
        leaves: state.leaves,
        lastLogin: state.lastLogin,
        isFirstTime: state.isFirstTime,
        supporterId: state.supporterId,
        currentBookTitle: state.currentBookTitle,
        totalBookPages: state.totalBookPages,
        currentBookReadPages: state.currentBookReadPages,
        completedBooks: state.completedBooks,
        treeVisuals: state.treeVisuals
    };
    localStorage.setItem('readingTreeState', JSON.stringify(persistent));
}

// --- Book Cycle Logic ---
function checkBookFinished() {
    if (state.totalBookPages && state.currentBookReadPages >= state.totalBookPages) {
        const newArchive = {
            id: Date.now(),
            title: state.currentBookTitle || "無題の本",
            totalPages: state.totalBookPages,
            completedDate: new Date().toISOString(),
            leaves: [...state.leaves],
            treeVisuals: state.treeVisuals ? { ...state.treeVisuals } : getDefaultVisuals()
        };
        if (!state.completedBooks) {
            state.completedBooks = [];
        }
        state.completedBooks.push(newArchive);

        alert(`おめでとうございます！「${newArchive.title}」を読み終えました！\n立派な木が育ちました。\nアルバムに保存され、新しい種からスタートします。`);
        resetCycle();

        // サイクルリセット後、自動的に新しい本の登録ダイアログを開く
        elements.modalBookSetup.classList.remove('hidden');
    }
}

function resetCycle() {
    state.level = 1;
    state.currentExp = 0;
    state.leaves = []; // In a real app, archive this
    state.currentBookTitle = "";
    state.totalBookPages = null;
    state.currentBookReadPages = 0;
    state.treeVisuals = null; // Clear so new book will pick a new random one
    saveState();
    updateUI();
    setRandomMessage(); // 種に戻った後は通常メッセージに戻す
}

// --- Intro / Onboarding ---
let introStep = 0;

function startIntro() {
    elements.introLayer.classList.remove('hidden');
    elements.header.classList.add('hidden');

    // Reset to Title State
    elements.introStartBtn.classList.remove('hidden');
    elements.introDialogue.classList.add('hidden');
    const nav = document.getElementById('intro-nav-container');
    if (nav) nav.classList.add('hidden');
    introStep = 0;
}

function nextIntroStep() {
    introStep++;
    updateIntroUI();
}

function prevIntroStep() {
    if (introStep > 0) {
        introStep--;
        updateIntroUI();
    }
}

function updateIntroUI() {
    const tutorial = getSupporter().tutorial;
    if (introStep < tutorial.length) {
        elements.introText.innerText = tutorial[introStep];

        const btnBack = document.getElementById('intro-back-btn');
        const btnNext = document.getElementById('intro-next-btn');

        if (introStep === 0) {
            btnBack.style.visibility = 'hidden';
        } else {
            btnBack.style.visibility = 'visible';
        }

        if (introStep === tutorial.length - 1) {
            btnNext.innerText = "OK";
            btnNext.style.fontSize = "1.5rem";
            btnNext.style.fontWeight = "bold";
        } else {
            btnNext.innerText = "▶";
            btnNext.style.fontSize = "2.5rem";
        }

    } else {
        endIntro();
    }
}

function endIntro() {
    elements.introLayer.classList.add('hidden');
    state.isFirstTime = false;
    saveState();

    // Stop BGM
    bgm.pause();
    bgm.currentTime = 0;

    // Hide Toggle Button
    if (elements.introMusicToggle) {
        elements.introMusicToggle.style.display = 'none';
    }

    showMainGame();
}

function showRecords() {
    const modal = document.getElementById('records-modal');
    
    // Reset to "current book" tab when opening
    switchRecordsTab('current');

    renderCurrentBookRecords();
    renderCompletedBooksRecords();

    modal.classList.remove('hidden');
}

function switchRecordsTab(tabName) {
    const tabCurrent = document.getElementById('tab-current-book');
    const tabCompleted = document.getElementById('tab-completed-books');
    const panelCurrent = document.getElementById('current-book-records');
    const panelCompleted = document.getElementById('completed-books-records');

    if (!tabCurrent || !tabCompleted || !panelCurrent || !panelCompleted) return;

    if (tabName === 'current') {
        tabCurrent.classList.add('active');
        tabCompleted.classList.remove('active');
        panelCurrent.classList.remove('hidden');
        panelCompleted.classList.add('hidden');
    } else {
        tabCurrent.classList.remove('active');
        tabCompleted.classList.add('active');
        panelCurrent.classList.add('hidden');
        panelCompleted.classList.remove('hidden');
    }
}

function renderCurrentBookRecords() {
    const titleDisplay = document.getElementById('current-book-title-display');
    const container = document.getElementById('records-list');
    if (!titleDisplay || !container) return;

    // Title and progress
    if (state.totalBookPages) {
        titleDisplay.textContent = `📖 現在読んでいる本: ${state.currentBookTitle || "無題の本"} (${state.currentBookReadPages} / ${state.totalBookPages} ページ)`;
        titleDisplay.style.display = 'block';
    } else {
        titleDisplay.textContent = `📖 現在読んでいる本はありません`;
        titleDisplay.style.display = 'block';
    }

    // Clear list
    container.innerHTML = '';

    if (state.leaves.length === 0) {
        container.innerHTML = '<p class="no-records">まだこの本の記録がありません。</p>';
    } else {
        // Sort by date desc
        const sortedLeaves = [...state.leaves].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedLeaves.forEach(leaf => {
            const dateObj = new Date(leaf.date);
            const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

            const div = document.createElement('div');
            div.className = 'record-item';
            div.innerHTML = `
                <div class="record-header">
                    <span>${dateStr}</span>
                    <span class="record-pages">${leaf.pages}ページ</span>
                </div>
                <div class="record-note">${escapeHtml(leaf.note || '（メモなし）')}</div>
            `;
            container.appendChild(div);
        });
    }
}

function renderCompletedBooksRecords() {
    const container = document.getElementById('completed-books-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (!state.completedBooks || state.completedBooks.length === 0) {
        container.innerHTML = '<p class="no-records">読了した本はまだありません。</p>';
        return;
    }

    // Sort by completedDate desc
    const sortedBooks = [...state.completedBooks].sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));

    sortedBooks.forEach(book => {
        const dateObj = new Date(book.completedDate);
        const dateStr = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

        const accordionItem = document.createElement('div');
        accordionItem.className = 'book-accordion-item';

        // Header
        const completedTree = book.treeVisuals || getDefaultVisuals();

        // Header
        const header = document.createElement('div');
        header.className = 'book-accordion-header';
        
        // Generate miniature SVG
        const miniSvgHtml = createMiniatureTreeSvg(completedTree, book.id);

        header.innerHTML = `
            <div class="completed-tree-preview">
                ${miniSvgHtml}
            </div>
            <div class="book-accordion-info">
                <div class="book-accordion-title">🌳 ${escapeHtml(book.title)}</div>
                <div class="book-accordion-meta">
                    <span>合計 ${book.totalPages} ページ</span>
                    <span class="book-accordion-meta-date">読了: ${dateStr}</span>
                </div>
            </div>
            <span class="book-accordion-arrow">▼</span>
        `;

        // Content (Nested records)
        const content = document.createElement('div');
        content.className = 'book-accordion-content';
        
        const listWrapper = document.createElement('div');
        listWrapper.className = 'nested-record-list';

        if (!book.leaves || book.leaves.length === 0) {
            listWrapper.innerHTML = '<p class="no-records" style="font-size: 0.9rem; margin: 0;">この本のメモはありません。</p>';
        } else {
            // Sort nested leaves desc
            const sortedLeaves = [...book.leaves].sort((a, b) => new Date(b.date) - new Date(a.date));
            sortedLeaves.forEach(leaf => {
                const leafDate = new Date(leaf.date);
                const leafDateStr = `${leafDate.getMonth() + 1}/${leafDate.getDate()} ${leafDate.getHours().toString().padStart(2, '0')}:${leafDate.getMinutes().toString().padStart(2, '0')}`;

                const item = document.createElement('div');
                item.className = 'nested-record-item';
                item.innerHTML = `
                    <div class="nested-record-header">
                        <span>${leafDateStr}</span>
                        <span class="nested-record-pages">${leaf.pages}ページ</span>
                    </div>
                    <div class="nested-record-note">${escapeHtml(leaf.note || '（メモなし）')}</div>
                `;
                listWrapper.appendChild(item);
            });
        }

        content.appendChild(listWrapper);
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);

        // Click Event for Accordion
        header.addEventListener('click', () => {
            const isOpen = accordionItem.classList.contains('open');
            
            if (isOpen) {
                accordionItem.classList.remove('open');
                content.style.maxHeight = '0px';
            } else {
                accordionItem.classList.add('open');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });

        container.appendChild(accordionItem);
    });
}


function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

function showMainGame() {
    elements.introLayer.classList.add('hidden');
    elements.concentrationLayer.classList.add('hidden');
    elements.modalSetup.classList.add('hidden');
    elements.modalResult.classList.add('hidden');
    elements.header.classList.remove('hidden');

    const changeBtn = document.getElementById('change-supporter-btn');
    if (changeBtn) { changeBtn.style.display = ''; changeBtn.classList.remove('hidden'); }

    applySupporter(state.supporterId || 0);
    updateUI();
    setRandomMessage();
    elements.messageArea.classList.remove('hidden');
}

// 重複のため削除し、上部に集約しました。

function checkLevelUp() {
    const oldLevel = state.level;
    let leveledUp = false;

    while (true) {
        if (state.level >= CONFIG.LEVEL_MAX) {
            state.currentExp = 0; // MAX レベルでは EXP を溜めない
            break;
        }
        const requiredExp = state.level * CONFIG.EXP_BASE;
        if (state.currentExp >= requiredExp) {
            state.currentExp -= requiredExp;
            state.level++;
            leveledUp = true;
        } else {
            break;
        }
    }

    if (leveledUp) {
        saveState();
        playSe(seLevelUp);

        const newLevel = state.level;

        // ステージ遷移の検知（種→芽→木）
        if (oldLevel === CONFIG.LEVEL_SEED_MAX && newLevel >= CONFIG.LEVEL_TREE_MIN) {
            // 種から一気に木へ
            treeBurstQueued = true;
            setTimeout(() => {
                alert(`🌳 種から一気に立派な木へ大成長しました！`);
                updateUI();
            }, 100);
        } else if (oldLevel === CONFIG.LEVEL_SEED_MAX && newLevel >= CONFIG.LEVEL_SPROUT_MIN) {
            // 種→芽
            sproutBurstQueued = true;
            setTimeout(() => {
                alert(`🌱 土から可愛い芽が出ました！`);
                updateUI();
            }, 100);
        } else if (oldLevel < CONFIG.LEVEL_TREE_MIN && newLevel >= CONFIG.LEVEL_TREE_MIN) {
            // 芽→木
            treeBurstQueued = true;
            setTimeout(() => {
                alert(`🌳 芽が立派な木に成長しました！`);
                updateUI();
            }, 100);
        } else if (newLevel >= CONFIG.LEVEL_MAX) {
            // MAX レベル到達
            setTimeout(() => {
                alert(`🏆 MAX レベル Lv.${CONFIG.LEVEL_MAX} に到達しました！おめでとうございます！`);
                updateUI();
            }, 100);
        } else {
            setTimeout(() => {
                alert(`🎉 レベルアップ！ Lv.${state.level} になりました！`);
                updateUI();
            }, 100);
        }
    }
}

// --- Game UI Updates ---

function setRandomMessage() {
    const supporter = getSupporter();
    const isCompleted = state.totalBookPages && state.currentBookReadPages >= state.totalBookPages;
    if (isCompleted) {
        elements.welcomeMessage.textContent = supporter.completedMessage(state.currentBookTitle);
    } else {
        const msgs = supporter.messages;
        elements.welcomeMessage.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    }
}

function updateUI() {
    // 読了時のボタンテキストの切り替え
    const isCompleted = state.totalBookPages && state.currentBookReadPages >= state.totalBookPages;
    if (isCompleted) {
        elements.btnStart.textContent = "新しい種を植える";
    } else {
        elements.btnStart.textContent = "読書開始";
    }

    // Stats
    elements.levelDisplay.textContent = state.level >= CONFIG.LEVEL_MAX ? `${state.level} MAX` : state.level;
    const requiredExp = state.level >= CONFIG.LEVEL_MAX ? 1 : state.level * CONFIG.EXP_BASE;
    const progress = state.level >= CONFIG.LEVEL_MAX ? 100 : (state.currentExp / requiredExp) * 100;
    elements.expBar.style.width = `${Math.min(progress, 100)}%`;

    // Remaining EXP
    const remaining = state.level >= CONFIG.LEVEL_MAX ? 0 : Math.max(0, requiredExp - state.currentExp);
    if (elements.nextLevelExp) {
        elements.nextLevelExp.textContent = state.level >= CONFIG.LEVEL_MAX ? 'MAX' : remaining;
    }

    // Tree Visuals Logic
    const svgSeed = elements.mainTree.querySelector('.tree-seed');
    const svgSprout = elements.mainTree.querySelector('.tree-sprout');
    const svgAdult = elements.mainTree.querySelector('.tree-adult');

    if (svgSeed && svgSprout && svgAdult) {
        // Reset visibility
        svgSeed.classList.add('hidden');
        svgSprout.classList.add('hidden');
        svgAdult.classList.add('hidden');

        // Remove animation burst classes to allow restarts
        svgSprout.classList.remove('anim-sprout-burst');
        svgAdult.classList.remove('anim-tree-burst');

        // Reset legacy classes logic for scaling
        elements.treeContainer.className = 'tree-stage';

        if (state.level <= CONFIG.LEVEL_SEED_MAX) {
            // 種: Lv.1
            svgSeed.classList.remove('hidden');
            elements.treeContainer.classList.add('tree-level-1');
        } else if (state.level <= CONFIG.LEVEL_SPROUT_MAX) {
            // 芽: Lv.2〜5
            svgSprout.classList.remove('hidden');
            elements.treeContainer.classList.add(`tree-level-${state.level}`);

            if (sproutBurstQueued) {
                sproutBurstQueued = false;
                void svgSprout.offsetWidth;
                svgSprout.classList.add('anim-sprout-burst');
            }
        } else {
            // 木: Lv.6〜20
            svgAdult.classList.remove('hidden');
            elements.treeContainer.classList.add(`tree-level-${Math.min(state.level, 7)}`);

            if (treeBurstQueued) {
                treeBurstQueued = false;
                void svgAdult.offsetWidth;
                svgAdult.classList.add('anim-tree-burst');
            }
        }

        // Apply dynamic visuals
        applyTreeVisuals(state.treeVisuals, state.level, elements.mainTree);
    }

    // Render Leaves on Home Screen
    renderHomeLeaves();
}

function renderHomeLeaves() {
    // Clear existing dynamic leaves
    const existingLeaves = elements.treeContainer.querySelectorAll('.home-leaf');
    existingLeaves.forEach(el => el.remove());

    // Generate new leaves
    const count = state.leaves.length;

    for (let i = 0; i < count; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'home-leaf';

        // Random Position
        const side = i % 2 === 0 ? -1 : 1;
        const randomX = (Math.random() * 25) + 20;

        // Prevent overlap: lower max height. 
        // 10% to 50% from bottom
        const randomY = (Math.random() * 40) + 10;

        const leftPos = (side === -1) ? (50 - randomX) : (50 + randomX);
        const topPos = 100 - randomY;

        leaf.style.left = `${leftPos}%`;
        leaf.style.top = `${topPos}%`;

        const rot = -45 + (Math.random() * 60 - 30);
        leaf.style.transform = `rotate(${rot}deg)`;

        elements.treeContainer.appendChild(leaf);
    }
}

let selectedSupporterId = 0; // サポーター選択画面での一時選択ID

function setupEventListeners() {
    // Intro
    elements.introStartBtn.addEventListener('click', () => {
        playSe(seTap);

        if (!state.isFirstTime) {
            // 2回目以降: そのままメインゲームへ
            endIntro();
        } else {
            // 初回: サポーター選択画面へ
            elements.introStartBtn.classList.add('hidden');
            document.getElementById('supporter-select-screen').classList.remove('hidden');
        }
    });

    // サポーター選択
    document.querySelectorAll('.supporter-option').forEach(opt => {
        opt.addEventListener('click', () => {
            playSe(seTap);
            document.querySelectorAll('.supporter-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedSupporterId = parseInt(opt.dataset.id);
            document.getElementById('supporter-select-btn').disabled = false;
        });
    });

    document.getElementById('supporter-select-btn').addEventListener('click', () => {
        playSe(seTap);
        state.supporterId = selectedSupporterId;
        applySupporter(state.supporterId);
        // 選択画面を隠してチュートリアルへ
        document.getElementById('supporter-select-screen').classList.add('hidden');
        elements.introDialogue.classList.remove('hidden');
        document.getElementById('intro-nav-container').classList.remove('hidden');
        const changeBtn2 = document.getElementById('change-supporter-btn');
        if (changeBtn2) changeBtn2.classList.add('hidden');
        updateIntroUI();
    });

    // Intro Navigation
    document.getElementById('intro-back-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // prevent bubbling if any
        playSe(seTap);
        prevIntroStep();
    });

    document.getElementById('intro-next-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        playSe(seTap); // or seTalk? user said seTalk for dialogue progression previously, but buttons usually tap. Let's use Talk for progression.
        playSe(seTalk);
        nextIntroStep();
    });

    // サポーター変更ボタン（ホーム画面）
    let changeModalSelectedId = -1;

    const changeSupporterBtn = document.getElementById('change-supporter-btn');
    if (changeSupporterBtn) {
        changeSupporterBtn.addEventListener('click', () => {
            playSe(seTap);
            changeModalSelectedId = -1;
            const modal = document.getElementById('supporter-change-modal');
            if (!modal) return;
            modal.querySelectorAll('.supporter-option').forEach(opt => {
                opt.classList.toggle('selected', parseInt(opt.dataset.id) === state.supporterId);
            });
            changeModalSelectedId = state.supporterId;
            const confirmBtn = document.getElementById('confirm-supporter-change-btn');
            if (confirmBtn) confirmBtn.disabled = false;
            modal.classList.remove('hidden');
        });
    }

    const changeModal = document.getElementById('supporter-change-modal');
    if (changeModal) {
        changeModal.querySelectorAll('.supporter-option').forEach(opt => {
            opt.addEventListener('click', () => {
                playSe(seTap);
                changeModal.querySelectorAll('.supporter-option')
                    .forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                changeModalSelectedId = parseInt(opt.dataset.id);
                document.getElementById('confirm-supporter-change-btn').disabled = false;
            });
        });
    }

    const confirmSupporterBtn = document.getElementById('confirm-supporter-change-btn');
    if (confirmSupporterBtn) {
        confirmSupporterBtn.addEventListener('click', () => {
            playSe(seTap);
            if (changeModalSelectedId < 0) return;
            state.supporterId = changeModalSelectedId;
            applySupporter(state.supporterId);
            saveState();
            const m = document.getElementById('supporter-change-modal');
            if (m) m.classList.add('hidden');
        });
    }

    const cancelSupporterBtn = document.getElementById('cancel-supporter-change-btn');
    if (cancelSupporterBtn) {
        cancelSupporterBtn.addEventListener('click', () => {
            playSe(seTap);
            const m = document.getElementById('supporter-change-modal');
            if (m) m.classList.add('hidden');
        });
    }

    // ハンバーガーメニュー
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const helpDrawer   = document.getElementById('help-drawer');
    const helpOverlay  = document.getElementById('help-overlay');
    const helpClose    = document.getElementById('help-drawer-close');

    function openHelpDrawer() {
        helpDrawer.classList.remove('hidden');
        helpOverlay.classList.remove('hidden');
        requestAnimationFrame(() => helpDrawer.classList.add('open'));
        hamburgerBtn.classList.add('open');
    }

    function closeHelpDrawer() {
        helpDrawer.classList.remove('open');
        hamburgerBtn.classList.remove('open');
        setTimeout(() => {
            helpDrawer.classList.add('hidden');
            helpOverlay.classList.add('hidden');
        }, 300);
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => { playSe(seTap); openHelpDrawer(); });
    if (helpClose)    helpClose.addEventListener('click',    () => { playSe(seTap); closeHelpDrawer(); });
    if (helpOverlay)  helpOverlay.addEventListener('click',  () => closeHelpDrawer());

    // Q&A アコーディオン
    document.querySelectorAll('.qa-question').forEach(btn => {
        btn.addEventListener('click', () => {
            playSe(seTap);
            const answer = btn.nextElementSibling;
            const isOpen = btn.classList.contains('open');
            // 他を閉じる
            document.querySelectorAll('.qa-question.open').forEach(b => {
                b.classList.remove('open');
                b.nextElementSibling.classList.remove('open');
            });
            if (!isOpen) {
                btn.classList.add('open');
                answer.classList.add('open');
            }
        });
    });

    // BGM Toggle
    if (elements.introMusicToggle) {
        elements.introMusicToggle.addEventListener('click', (e) => {
            playSe(seTap);
            e.stopPropagation(); // Prevent bubbling issues
            if (bgm.paused) {
                bgm.play().catch(e => console.log('BGM Play Error:', e));
                elements.introMusicToggle.style.opacity = '1';
            } else {
                bgm.pause();
                elements.introMusicToggle.style.opacity = '0.5';
            }
        });
    }

    // Game Buttons
    elements.btnStart.addEventListener('click', () => {
        playSe(seTap);

        // 本を読み終えている場合は、まずサイクル完了・リセット処理を行う
        if (state.totalBookPages && state.currentBookReadPages >= state.totalBookPages) {
            checkBookFinished();
            return;
        }

        if (!state.totalBookPages) {
            elements.modalBookSetup.classList.remove('hidden');
        } else {
            openSetupModal();
        }
    });

    // Book Setup Buttons
    if (elements.btnCancelBookSetup) {
        elements.btnCancelBookSetup.addEventListener('click', () => {
            playSe(seTap);
            elements.modalBookSetup.classList.add('hidden');
        });
    }
    if (elements.btnStartBook) {
        elements.btnStartBook.addEventListener('click', () => {
            playSe(seTap);
            const total = parseInt(elements.inputBookTotalPages.value, 10);
            const titleInput = document.getElementById('book-title-input');
            const title = titleInput ? titleInput.value.trim() : "";

            if (isNaN(total) || total < 100) {
                alert("本の最低ページ数は100ページです。100ページ以上の総ページ数を入力してください。");
            } else {
                state.currentBookTitle = title || "無題の本";
                state.totalBookPages = total;
                state.currentBookReadPages = 0;
                state.treeVisuals = generateRandomVisuals(); // Generate a new set of random visual styles for this book
                saveState();

                // Clear input fields
                if (titleInput) titleInput.value = "";
                elements.inputBookTotalPages.value = "";

                elements.modalBookSetup.classList.add('hidden');
                openSetupModal();
            }
        });
    }
    elements.btnRecords.addEventListener('click', () => {
        playSe(seTap);
        showRecords();
    });
    // SE for generic buttons
    document.querySelectorAll('.btn, .tab-btn, .preset-btn').forEach(btn => {
        // Avoid duplicate listeners if possible, but for simplicity here we assume unique binding or rely on specific IDs above.
        // Actually, let's just add it to specific modals buttons for now to avoid duplication with IDs
    });

    // Modal Interactions
    elements.btnCancelSetup.addEventListener('click', () => {
        playSe(seTap);
        elements.modalSetup.classList.add('hidden');
    });
    elements.btnStartSession.addEventListener('click', () => {
        playSe(seTap);
        startSession();
    });
    elements.btnSaveResult.addEventListener('click', () => {
        playSe(seTap);
        saveResult();
    });

    // Records Modal Interaction
    const btnCloseRecords = document.getElementById('close-records-btn');
    if (btnCloseRecords) {
        btnCloseRecords.addEventListener('click', () => {
            document.getElementById('records-modal').classList.add('hidden');
        });
    }

    // Tabs
    elements.tabTime.addEventListener('click', () => {
        state.sessionMode = 'time';
        elements.tabTime.classList.add('active');
        elements.tabPages.classList.remove('active');
        elements.panelTime.classList.remove('hidden');
        elements.panelPages.classList.add('hidden');
    });

    elements.tabPages.addEventListener('click', () => {
        state.sessionMode = 'pages';
        elements.tabPages.classList.add('active');
        elements.tabTime.classList.remove('active');
        elements.panelPages.classList.remove('hidden');
        elements.panelTime.classList.add('hidden');
    });

    // Presets
    elements.presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.presetBtns.forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            elements.inputTime.value = e.target.dataset.time;
        });
    });

    // Stop Button
    let pressTimer;
    const startPress = (e) => {
        e.preventDefault();
        elements.btnStopSession.textContent = "そのまま押し続けて...";
        pressTimer = setTimeout(() => {
            stopSession();
            elements.btnStopSession.textContent = "長押しで終了";
        }, 1000);
    };
    const endPress = () => {
        clearTimeout(pressTimer);
        elements.btnStopSession.textContent = "長押しで終了";
    };

    elements.btnStopSession.addEventListener('mousedown', startPress);
    elements.btnStopSession.addEventListener('mouseup', endPress);
    elements.btnStopSession.addEventListener('touchstart', startPress, { passive: true });
    elements.btnStopSession.addEventListener('touchend', endPress, { passive: true });

    // Records Modal Tabs
    const tabCurrent = document.getElementById('tab-current-book');
    const tabCompleted = document.getElementById('tab-completed-books');
    if (tabCurrent && tabCompleted) {
        tabCurrent.addEventListener('click', () => {
            playSe(seTap);
            switchRecordsTab('current');
        });
        tabCompleted.addEventListener('click', () => {
            playSe(seTap);
            switchRecordsTab('completed');
        });
    }

    // Tree Interaction
    elements.treeContainer.addEventListener('click', () => {
        elements.mainTree.style.transform = 'scale(1.1)';
        setTimeout(() => elements.mainTree.style.transform = '', 150);
    });
}

// --- Bootstrap ---
window.addEventListener('DOMContentLoaded', init);
