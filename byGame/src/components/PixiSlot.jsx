
import { useEffect, useRef } from 'react';
import {
    Application,
    Assets,
    BlurFilter,
    Color,
    Container,
    FillGradient,
    Graphics,
    Sprite,
    Text,
    TextStyle,
    Texture,
} from 'pixi.js';
// import { BaseTexture } from '@pixi/core';

export function PixiSlot({ imageUrls }) {
    const pixiContainerRef = useRef(null);
  
    useEffect(() => {
      if (!imageUrls.length) 
       {
        console.log("НЕма зображень!!!")
        return;
       }

      const app = new Application();
        
      const setup = async () => {
        await app.init({ background: '#003303', resizeTo: pixiContainerRef.current });
        let autoSpinning = false;
        let autoSpinInterval = null;
        
     
        pixiContainerRef.current.appendChild(app.canvas);


        const slotTextures = await loadTextures(imageUrls);

        
        const REEL_WIDTH = 150;
        const SYMBOL_SIZE = 130;

       
        // Build the reels
        const reels = [];
        const reelContainer = new Container();
    
        for (let i = 0; i < 5; i++)
        {
            const rc = new Container();
    
            rc.x = i * REEL_WIDTH;
            reelContainer.addChild(rc);
    
            const reel = {
                container: rc,
                symbols: [],
                position: 0,
                previousPosition: 0,
                blur: new BlurFilter(),
            };
    
            reel.blur.blurX = 0;
            reel.blur.blurY = 0;
            rc.filters = [reel.blur];
    
            // Build the symbols
            for (let j = 0; j < 4; j++) {
                const texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                const symbol = new Sprite(texture);
    
                // Масштабування + центрування
                const scale = Math.min(SYMBOL_SIZE / texture.width, SYMBOL_SIZE / texture.height);
                symbol.scale.set(scale);
                symbol.x = Math.round((SYMBOL_SIZE - texture.width * scale) / 2);
                symbol.y = j * SYMBOL_SIZE;
    
                reel.symbols.push(symbol);
                rc.addChild(symbol);
            }
    
            reels.push(reel);
        }
        app.stage.addChild(reelContainer);
    
        // Build top & bottom covers and position reelContainer
        const margin = (app.screen.height - SYMBOL_SIZE * 3) / 2;
    
        reelContainer.y = margin;
        reelContainer.x = Math.round((app.screen.width - REEL_WIDTH * 5));
        const top = new Graphics().rect(0, 0, app.screen.width, margin).fill({ color: 0x0 });
        const bottom = new Graphics().rect(0, SYMBOL_SIZE * 3 + margin, app.screen.width, margin).fill({ color: 0x0 });
    
        // Create gradient fill
        const fill = new FillGradient(0, 0, 0, 2);
    
        const colors = [0xffffff, 0x00ff99].map((color) => Color.shared.setValue(color).toNumber());
    
        colors.forEach((number, index) =>
        {
            const ratio = index / colors.length;
    
            fill.addColorStop(ratio, number);
        });
    
        // Add play text
        const style = new TextStyle({
            fontFamily: 'Verdana',
            fontSize: 28,
            fontWeight: '600',
            fill: 0xffffff, // Білий
            align: 'center',
        });
    
        // const playText = new Text('Spin the wheels!', style);
        const playButton = createButton('Spin', 160, 50, startPlay);
        const autoSpinButton = createButton('Auto Spin', 160, 50, toggleAutoSpin);
        const winButton = createButton('Win', 160, 50, forceWinMiddleRow);
        let selectedRow = 1; 



        const buttonSpacing = 20;
        
        // Розрахунок загальної ширини (кнопка + відступ + кнопка)
        const totalWidth = playButton.width + buttonSpacing + autoSpinButton.width;
        
        // Вирівнюємо обидві кнопки по центру контейнера
        const startX = (bottom.width - totalWidth) / 2;
        const buttonY = app.screen.height - margin + Math.round((margin - playButton.height) / 2);
        
        // Встановлюємо позиції
        playButton.x = startX;
        playButton.y = buttonY;
        
        autoSpinButton.x = startX + playButton.width + buttonSpacing;
        autoSpinButton.y = buttonY;

        winButton.x = autoSpinButton.x + autoSpinButton.width + buttonSpacing;
        winButton.y = buttonY;
        
        // Додаємо обидві кнопки
        bottom.addChild(playButton);
        bottom.addChild(autoSpinButton);
        bottom.addChild(winButton);

        const headerText = new Text('ByGaming!', style);
    
        headerText.x = Math.round((top.width - headerText.width) / 2);
        headerText.y = Math.round((margin - headerText.height) / 2);
        top.addChild(headerText);
    
        app.stage.addChild(top);
        app.stage.addChild(bottom);
    
        // Set the interactivity.
        bottom.eventMode = 'static';
        bottom.cursor = 'pointer';
        bottom.addListener('pointerdown', () =>
        {
            startPlay();
        });
    
        let running = false;

        function toggleAutoSpin() {
            if (autoSpinning) {
                autoSpinning = false;
                clearInterval(autoSpinInterval);
                autoSpinInterval = null;
                updateButtonText(autoSpinButton, 'Auto Spin');
                console.log('⏹️ Автоспін вимкнено');
            } else {
                autoSpinning = true;
                updateButtonText(autoSpinButton, 'Stop');
                console.log('▶️ Автоспін увімкнено');
                startPlay(); // одразу стартуємо
                autoSpinInterval = setInterval(() => {
                    if (!running) startPlay();
                }, 2000); // кожні 4 секунди
            }
        }
        function updateButtonText(button, newText) {
            const text = button.children.find(child => child instanceof Text);
            if (text) text.text = newText;
        }

        function forceWinMiddleRow() {
            if (running) return;
            
            running = true;

            const forcedRow = 1; // Середній рядок
            const forcedTexture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
            const forcedIndex = 0;

            for (let i = 0; i < reels.length; i++) {
                const r = reels[i];
                r.symbols[forcedIndex].texture = forcedTexture;

                const currentPos = Math.floor(r.position);
                const offset = ((forcedIndex - forcedRow) % 4 + 4) % 4;
                const extraSpins = 2 + Math.floor(Math.random() * 4);
                const target = currentPos + offset + 4 * extraSpins;
                const time = 2500 + i * 600;

                tweenTo(r, 'position', target, time, backout(0.5), null,
                    i === reels.length - 1 ? reelsComplete : null);
            }
        }

        // Function to start playing.
        function startPlay()
        {
            if (running) 
                return;
            
            running = true;

            const forcedRow = selectedRow;
            const forcedTexture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
            
            const forcedIndex = 0;
            console.log('[startPlay] forcedRow =', forcedRow, 'forcedIndex =', forcedIndex, 'forcedTexture.myUrl =', forcedTexture.myUrl);


            for (let i = 0; i < reels.length; i++)
                {
                    const r = reels[i];
            
                    r.symbols[forcedIndex].texture = forcedTexture;
            
                    // 5) Обчислюємо offset, щоб finalPosition + forcedRow = forcedIndex (mod 4)
                    //    Тобто (finalPos + forcedRow) % 4 = forcedIndex
                    //    => finalPos % 4 = (forcedIndex - forcedRow) mod 4
                    const currentPos = Math.floor(r.position);
                    const offset = ((forcedIndex - forcedRow) % 4 + 4) % 4;
            
                    // 6) Додаємо випадкову кількість обертів (наприклад, 2..5)
                    const extraSpins = 2 + Math.floor(Math.random() * 4); 
                    // 7) Загальний target:
                    const target = currentPos + offset + 4 * extraSpins;
            
                    // 8) Робимо tween від r.position до target (можна час підібрати, аби відрізнявся)
                    const time = 2500 + i * 600; // або інший розрахунок

                    console.log(`[startPlay] Reel #${i}: currentPos=${currentPos}, offset=${offset}, extraSpins=${extraSpins}, target=${target}`);


                    tweenTo(r, 'position', target, time, backout(0.5), null,
                        i === reels.length - 1 ? reelsComplete : null);
                }
        }
    
        // Reels done handler.
        function reelsComplete()
        {
            running = false;
         
            const finalGrid = getFinalSymbols();
              // Виведемо finalGrid построчно
            for (let row = 0; row < 3; row++) {
                let rowUrls = [];
                for (let col = 0; col < 5; col++) {
                const url = finalGrid[row][col].texture.myUrl;
                rowUrls.push(url);
                }
                console.log(`[reelsComplete] row=${row}:`, rowUrls);
            }
        
            checkHorizontalLines(finalGrid);

            // const TARGET_URL = 'http://localhost:8080/ipfs/QmVNRPsPrSActuc8uSbkLFFeNpzfznTmS8BCN5bUjzNte2'

            // reels.forEach(reel => {
            //     reel.symbols.forEach(symbol => {
            //         const texUrl = symbol.texture.myUrl;
        
            //         if (texUrl === TARGET_URL) {
            //             pulseSymbol(symbol);
            //         }
            //     });
            // });
         
        }
    
        function getFinalSymbols()
        {
            const rows = 3;
            const cols = 5;
            const grid = [];
        
            for (let row = 0; row < rows; row++) {
                grid[row] = [];
                for (let col = 0; col < cols; col++) {
                  const reel = reels[col];
                  // Розвертаємо row:
                  // Якщо row=0 (нижній), realRow=2
                  // Якщо row=2 (верхній), realRow=0
                  const realRow = (rows - 1) - row;

                  const index = (Math.floor(reel.position) + realRow) % reel.symbols.length;
                  const sprite = reel.symbols[index];
                  grid[row][col] = sprite;
                }
              }
            
            return grid;
        }
        
        function checkHorizontalLines(finalGrid) {
            const row = 1;
            const cols = finalGrid[0].length;
            const firstTex = finalGrid[row][0].texture;
            let allMatch = true;
        
            for (let col = 1; col < cols; col++) {
                if (finalGrid[row][col].texture !== firstTex) {
                    allMatch = false;
                    break;
                }
            }
        
            if (allMatch) {
                console.log(`🎉 ВИГРАШ! Рядок ${row} має 5 однакових картинок.`);
                finalGrid[row].forEach(sprite => {
                    sprite.tint = 0xff0000; // або анімація
                    // pulseSymbol(sprite);     
                });
            } else {
                console.log(`❌ Нема виграшу в рядку ${row}`);
            }
        }
        
        
        // Listen for animate update.
        app.ticker.add(() =>
        {
            // Update the slots.
            for (let i = 0; i < reels.length; i++)
            {
                const r = reels[i];
                // Update blur filter y amount based on speed.
                // This would be better if calculated with time in mind also. Now blur depends on frame rate.
    
                r.blur.blurY = (r.position - r.previousPosition) * 8;
                r.previousPosition = r.position;
    
                // Update symbol positions on reel.
                for (let j = 0; j < r.symbols.length; j++)
                {
                    const s = r.symbols[j];
                    // const prevy = s.y;
    
                    s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                    // if (s.y < 0 && prevy > SYMBOL_SIZE)
                    // {
                    //     const symbolIndex = j;
                    //     // Detect going 
                    //     // over and swap a texture.
                    //     // This should in proper product be determined from some logical reel.
                        
                    //     s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                    //     s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                    //     s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
                    // }
                }
            }
        });
    
        // Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
        const tweening = [];
    
        function tweenTo(object, property, target, time, easing, onchange, oncomplete)
        {
            const tween = {
                object,
                property,
                propertyBeginValue: object[property],
                target,
                easing,
                time,
                change: onchange,
                complete: oncomplete,
                start: Date.now(),
            };
    
            tweening.push(tween);
    
            return tween;
        }
        // Listen for animate update.
        app.ticker.add(() =>
        {
            const now = Date.now();
            const remove = [];
    
            for (let i = 0; i < tweening.length; i++)
            {
                const t = tweening[i];
                const phase = Math.min(1, (now - t.start) / t.time);
    
                t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
                if (t.change) t.change(t);
                if (phase === 1)
                {
                    t.object[t.property] = t.target;
                    if (t.complete) t.complete(t);
                    remove.push(t);
                }
            }
            for (let i = 0; i < remove.length; i++)
            {
                tweening.splice(tweening.indexOf(remove[i]), 1);
            }
        });

        // function pulseSymbol(symbol) {
        //     const duration = 300;
        //     const originalScale = symbol.scale.x;
        //     let t = 0;
        //     let direction = 1;
        //     let pulses = 0;
        
        //     const animatePulse = () => {
        //         t += app.ticker.deltaMS;
        //         const progress = Math.min(1, t / duration);
        //         const eased = backout(1)(progress); 
        
        //         const scale = direction === 1
        //             ? originalScale + 0.15 * eased
        //             : originalScale + 0.15 * (1 - eased);
        
        //         symbol.scale.set(scale);
        
        //         if (progress >= 1) {
        //             t = 0;
        //             direction *= -1;
        //             pulses++;
        
        //             if (pulses >= 6) {
        //                 symbol.scale.set(originalScale);
        //                 app.ticker.remove(animatePulse);
        //             }
        //         }
        //     };
        
        //     app.ticker.add(animatePulse);
        // }
        
        // Basic lerp funtion.
        function lerp(a1, a2, t)
        {
            return a1 * (1 - t) + a2 * t;
        }
    
        // Backout function from tweenjs.
        // https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
        function backout(amount)
        {
            return (t) => --t * t * ((amount + 1) * t + amount) + 1;
        }

        // (Увесь твій код із створення барабанів, спінів і т.д. сюди — все те, що в середині IIFE)
        // Не забудь замінити `document.body.appendChild` на `pixiContainerRef.current.appendChild`
  
      };
  
      setup();
  
    //   return () => {
    //     app.destroy(true, { children: true, texture: true, baseTexture: true });
    //   };
    }, []);
  
    return (
        <div
          ref={pixiContainerRef}
          style={{
            width: '800px',
            height: '600px',
            border: '2px solid white', // для наглядності
            margin: '0 auto',
          }}
        />
      );

      
  }
  async function loadTextures(urls) {
    const loadImage = (url) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const texture = Texture.from(img);
                texture.myUrl = url; 
                resolve(texture);
            };
            img.onerror = reject;
            img.src = url;
        });

    return await Promise.all(urls.map(loadImage));
  }
  
  function createButton(text, width, height, onClick) {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const background = new Graphics()
        .roundRect(0, 0, width, height, 12)
        .fill({ color: 0x1abc9c }); // бірюзово-зелений, сучасний

    const style = new TextStyle({
        fontFamily: 'Verdana',
        fontSize: 28,
        fontWeight: '600',
        fill: 0xffffff,
    });

    const buttonText = new Text({ text, style });
    buttonText.anchor.set(0.5);
    buttonText.x = width / 2;
    buttonText.y = height / 2;

    button.addChild(background, buttonText);

    // Hover-ефект (трохи темніше)
    button.on('pointerover', () => {
        background.tint = 0x16a085;
    });
    button.on('pointerout', () => {
        background.tint = 0xffffff;
    });

    button.on('pointerdown', onClick);

    return button;
}

