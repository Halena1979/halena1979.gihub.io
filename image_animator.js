export class ImageAnimator {
    // Added transition_type parameter (0 = blur/fade, 1 = wipe down reveal/wipe up hide)
    constructor(containerId="slideshow", fade_in_time = 1, hold_time = 2, fade_out_time = 1, filename_caption = true, transition_type = 0) {
        this._images = [];
        this.container = document.getElementById(containerId);
        this._fade_in_time = fade_in_time;
        this._hold_time = hold_time;
        this._fade_out_time = fade_out_time;
        this._filename_caption = filename_caption;
        this._transition_type = transition_type; // Store transition configuration
        this.timeOffset = 0; 
    } 

    /**
     * Silent Internal Image Preloader
     */
    preloadImages(filelist) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; height:100%; font-family:'Montserrat',sans-serif; font-weight:bold; font-size:16px; color:#555555;">
                    <div>Loading Gallery...</div>
                </div>
            `;
        }
        const promises = filelist.map(src => {
            return new Promise((resolve) => {
                const imgCache = new Image();
                imgCache.src = src; 
                imgCache.onload = () => resolve(src);
                imgCache.onerror = () => {
                    console.error(`Gallery loader failed to fetch asset target: ${src}`);
                    resolve(src); 
                };
            });
        });
        return Promise.all(promises);
    }

    next() {
        if (!this._images.length) return;
        const singleDuration = this.hold_time + this.fade_in_time + this.fade_out_time;
        const totalDuration = singleDuration * this._images.length;
        this.container.classList.add('paused');
        this.timeOffset -= singleDuration;
        if (Math.abs(this.timeOffset) >= totalDuration) {
            this.timeOffset = this.timeOffset % totalDuration;
        }
        this.applyManualTimeShift();
    }

    prev() {
        if (!this._images.length) return;
        const singleDuration = this.hold_time + this.fade_in_time + this.fade_out_time;
        const totalDuration = singleDuration * this._images.length;
        this.container.classList.add('paused');
        this.timeOffset += singleDuration;
        if (this.timeOffset > 0) {
            this.timeOffset = -totalDuration + singleDuration;
        }
        this.applyManualTimeShift();
    }

    applyManualTimeShift() {
        this._images.forEach((_, index) => {
            const slide = this.container.querySelector(`.anim-slide-${index}`);
            if (slide) {
                slide.style.animationDelay = `${this.timeOffset}s`;
            }
        });
    }

    buildAnimation() {
        if (!this.container) return;
        const count = this.images.length;
        const singleDuration = this.hold_time + this.fade_in_time + this.fade_out_time; 
        const totalDuration = singleDuration * count; 
        
        const fade_in_pct = (this.fade_in_time / totalDuration) * 100;
        const hold_pct = (this.hold_time / totalDuration) * 100;
        const fade_out_pct = (this.fade_out_time / totalDuration) * 100;
        const single_pct = (singleDuration / totalDuration) * 100;

        let keyframesCSS = '';
        this._images.forEach((_, index) => {
            const startDelay = index * single_pct;
            const p1 = startDelay.toFixed(4);
            const p2 = (startDelay + fade_in_pct).toFixed(4);
            const p3 = (startDelay + fade_in_pct + hold_pct).toFixed(4);
            const p4 = (startDelay + fade_in_pct + hold_pct + fade_out_pct).toFixed(4);

             const p3_mid = (startDelay + fade_in_pct + hold_pct + (fade_out_pct * 0.4)).toFixed(4);
            
            const p4a = (startDelay + fade_in_pct + hold_pct + fade_out_pct).toFixed(4);

            if (this._transition_type === 1) {
                // Option 1: Top-to-bottom Wipe Reveal, Bottom-to-top Wipe Hide
                // clip-path: inset(top right bottom left) specifies the hidden boundaries
                keyframesCSS += `
                    @keyframes slide-fade-loop-${index} { 
                        0%, ${p1}% { visibility: hidden; clip-path: inset(0 0 100% 0); animation-timing-function: ease-in-out;}
                        ${p2}% { visibility: visible; clip-path: inset(0 0 0% 0); animation-timing-function: linear;}
                        ${p3}% { visibility: visible; clip-path: inset(0 0 0% 0); animation-timing-function: ease-in-out; }
                        ${p4}%, 100% { visibility: hidden; clip-path: inset(0 0 100% 0); }
                    }
                `;
            } 
            else if (this._transition_type === 2) {
                // Option 2: Fade In Reveal ➔ Hold ➔ Bottom-to-top Wipe Hide
                  keyframesCSS += `
                    @keyframes slide-fade-loop-${index} { 
                        0%, ${p1}% { opacity: 0; visibility: hidden; clip-path: inset(0 0 0% 0); transform-origin: center top; transform: rotateX(0deg) scaleY(1); animation-timing-function: ease-in-out; }
                        ${p2}% { opacity: 1; visibility: visible; clip-path: inset(0 0 0% 0); transform-origin: center top; transform: rotateX(0deg) scaleY(1); animation-timing-function: linear; }
                        ${p3}% { opacity: 1; visibility: visible; clip-path: inset(0 0 0% 0); transform-origin: center top; transform: rotateX(0deg) scaleY(1); animation-timing-function: ease-in-out; }
                        ${p4}%, 100% { opacity: 0; visibility: hidden; clip-path: inset(0 0 100% 0); transform-origin: center top; transform: rotateX(-75deg) scaleY(0.6); }
                    }
                `;
            }
            else {
                // Option 0: Default Blur & Scale Fade Loop
                keyframesCSS += `
                    @keyframes slide-fade-loop-${index} { 
                        0%, ${p1}% { opacity: 0; mix-blend-mode: normal; visibility: hidden; transform: translate(100%, 0) scale(1.02); filter: blur(15px); animation-timing-function: ease-in-out;}
                        ${p2}% { opacity: 1; mix-blend-mode: normal; visibility: visible; transform: translate(0, 0) scale(1); filter: blur(0px); animation-timing-function: linear; }
                        ${p3}% { opacity: 1; mix-blend-mode: normal; visibility: visible; transform: translate(0, 0) scale(1); filter: blur(0px); animation-timing-function: ease-in-out;}
                        ${p4}%, 100% { opacity: 0; mix-blend-mode: normal; visibility: hidden; transform: translate(0, 0) scale(1.02); filter: blur(15px); }
                    }
                `;
            }
        });

        this.container.innerHTML = '';
        this.container.style.cssText = 'position:relative; overflow:hidden; width:100%; height:100%; box-sizing:border-box;';
        
        let styleRules = keyframesCSS + `
            #${this.container.id}.paused * { animation-play-state: paused !important; }
            .nav-btn { background: none; border: none; color: #555555; font-family: Montserrat, sans-serif; font-size: clamp(14px, 2.2cqi, 20px); font-weight: bold; cursor: pointer; padding: 5px 12px; touch-action: manipulation; transition: color 0.15s ease, transform 0.1s ease; }
            .nav-btn:active { color: #000000; transform: scale(0.85); }
             .pause-btn { font-size: clamp(20px, 3.2cqi, 28px); display: flex; align-items: center; justify-content: center; }
             .pause-glyph {
                color: transparent !important;
                background: transparent !important;
                -webkit-text-fill-color: #555555 !important;
            }
             #${this.container.id}.paused .pause-btn { text-decoration: line-through; text-decoration-thickness: 3px; color: #888888; }

        `;

        this._images.forEach((src, index) => {
            const urlParts = src.split('/');
            const rawFilename = urlParts[urlParts.length - 1];
            const lastDotIndex = rawFilename.lastIndexOf('.');
            const cleanTitle = (lastDotIndex !== -1 ? rawFilename.substring(0, lastDotIndex) : rawFilename).replaceAll("_", " ");

            // Structural full-screen anchor wrapper row
            const slide = document.createElement('div');
            slide.className = `anim-slide-${index}`;
            slide.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; box-sizing:border-box; padding:10px;';

            const controlRow = document.createElement('div');
            controlRow.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:15px; margin-bottom:8px; width:100%; flex-shrink:0; user-select:none; z-index:20;';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'nav-btn';
            prevBtn.textContent = '◀';
            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });

            //const note = document.createElement('div');
            //note.textContent = "Click image to pause/resume animation";
            //note.style.cssText = 'font-size:clamp(11px, 1.8cqi, 16px); font-style:italic; font-weight:bold; color:#555555; font-family:Montserrat,sans-serif; text-align:center;';

            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'nav-btn pause-btn';
           // /pauseBtn.textContent = '⏸\uFE0E';
           /// pauseBtn.style.color = 'transparent';
           // /pauseBtn.style.background = 'transparent';
           /// pauseBtn.style.webkitTextFillColor = "#555555";
            pauseBtn.innerHTML = `<span class="pause-glyph">⏸\uFE0E</span>`;
            pauseBtn.addEventListener('click', () => { this.container.classList.toggle('paused'); });

            const nextBtn = document.createElement('button');
            nextBtn.className = 'nav-btn';
            nextBtn.textContent = '▶';
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

            controlRow.appendChild(prevBtn);
            //controlRow.appendChild(note);
            controlRow.appendChild(pauseBtn);
            controlRow.appendChild(nextBtn);

            const img = document.createElement('img');
            img.src = src; 
            // FIXED: Standardized image layout constraints to fill the maximum remaining space without blowing out grid blocks
            img.style.cssText = 'width:100%; height:100%; min-height:0; flex-grow:1; object-fit:contain; cursor:pointer; display:block; z-index:10; margin:0;'; 
            img.addEventListener('click', () => { this.container.classList.toggle('paused'); });

            slide.appendChild(controlRow);
            slide.appendChild(img);

            if (this._filename_caption) {
                const caption = document.createElement('div');
                caption.textContent = cleanTitle;
                caption.style.cssText = 'margin-top:8px; font-size:clamp(16px, 3.8cqi, 26px); font-weight:bold; color:#000000; font-family:Montserrat,sans-serif; text-align:center; width:100%; flex-shrink:0; z-index:20;'; 
                slide.appendChild(caption);
            }
            
            this.container.appendChild(slide);
            styleRules += `.anim-slide-${index} { animation: slide-fade-loop-${index} ${totalDuration}s infinite linear; }`;
        });

        const oldStyle = document.getElementById('animator-styles');
        if (oldStyle) oldStyle.remove();

        const styleEl = document.createElement('style');
        styleEl.id = 'animator-styles';
        styleEl.textContent = styleRules;
        document.head.appendChild(styleEl);
    }

    get images() { return this._images; }
    set images(filelist) { 
        if (!Array.isArray(filelist) || filelist.length === 0) return;
        this.preloadImages(filelist).then((completedList) => {
            this._images = completedList;
            this.buildAnimation();
        });
    }

    get fade_in_time() { return this._fade_in_time; }
    get hold_time() { return this._hold_time; }
    get fade_out_time() { return this._fade_out_time; }
}