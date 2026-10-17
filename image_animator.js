export class ImageAnimator {
    constructor(containerId="slideshow", fade_in_time = 1, hold_time = 2, fade_out_time = 1, filename_caption = true) {
        this._images = [];
        this.container = document.getElementById(containerId);
        this._fade_in_time = fade_in_time;
        this._hold_time = hold_time;
        this._fade_out_time = fade_out_time;
        this._filename_caption = filename_caption;
        this.timeOffset = 0; 
    } 

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

            keyframesCSS += `
                @keyframes slide-fade-loop-${index} { 
                    0%, ${p1}% { opacity: 0; mix-blend-mode: normal; visibility: visible; transform: translate(100%, 0) scale(1.05); filter: blur(15px); z-index: 1; }
                    ${p2}% { opacity: 1; mix-blend-mode: normal; visibility: visible; transform: translate(0, 0) scale(1); filter: blur(0px); z-index: 10; }
                    ${p3}% { opacity: 1; mix-blend-mode: normal; visibility: visible; transform: translate(0, 0) scale(1); filter: blur(0px); z-index: 10; }
                    ${p4}%, 100% { opacity: 0; mix-blend-mode: normal; visibility: visible; transform: translate(0, 0) scale(1.05); filter: blur(15px); z-index: 1; }
                }
            `;
        });

        this.container.innerHTML = '';
        this.container.style.cssText = 'position:relative; overflow:hidden; width:100%; height:100%; box-sizing:border-box;';
        
        let styleRules = keyframesCSS + `
            #${this.container.id}.paused * { animation-play-state: paused !important; }
            .nav-btn { background: none; border: none; color: #555555; font-family: Montserrat, sans-serif; font-size: clamp(14px, 2.2cqi, 20px); font-weight: bold; cursor: pointer; padding: 5px 12px; touch-action: manipulation; transition: color 0.15s ease, transform 0.1s ease; }
            .nav-btn:active { color: #000000; transform: scale(0.85); }
        `;

        this._images.forEach((src, index) => {
            const filename = src.split('/').pop().replace(/\.[^/.]+$/, "");
            const slide = document.createElement('div');
            slide.className = `anim-slide-${index}`;
            slide.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; box-sizing:border-box; padding:20px;';

            // FIXED: Added width: 100% and flex-grow: 1 so it opens up to fill the whole display area
            const contentBlock = document.createElement('div');
            contentBlock.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; flex-grow:1; max-width:100%; max-height:100%; box-sizing:border-box;';

            const controlRow = document.createElement('div');
            controlRow.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:15px; margin-bottom:10px; width:100%; flex-shrink:0; user-select:none;';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'nav-btn';
            prevBtn.textContent = '◀';
            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });

            const note = document.createElement('div');
            note.textContent = "Click image to pause/resume animation";
            note.style.cssText = 'font-size:clamp(11px, 1.8cqi, 16px); font-style:italic; font-weight:bold; color:#555555; font-family:Montserrat,sans-serif; text-align:center;';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'nav-btn';
            nextBtn.textContent = '▶';
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

            controlRow.appendChild(prevBtn);
            controlRow.appendChild(note);
            controlRow.appendChild(nextBtn);

            const img = document.createElement('img');
            img.src = src; 
            // FIXED: Set to flex-grow:1 and max-height:100% to let the image naturally scale as large as the parent frame permits
            img.style.cssText = 'width:100%; height:100%; min-height:0; flex-grow:1; object-fit:contain; cursor:pointer; display:block;'; 
            img.addEventListener('click', () => { this.container.classList.toggle('paused'); });

            const caption = document.createElement('div');
            caption.textContent = filename.replaceAll("_", " ");
            caption.style.cssText = 'margin-top:10px; font-size:clamp(16px, 3.8cqi, 42px); font-weight:bold; color:#000000; font-family:Montserrat,sans-serif; text-align:center; width:100%; flex-shrink:0;'; 

            contentBlock.appendChild(controlRow);
            contentBlock.appendChild(img);
            if (this._filename_caption) { contentBlock.appendChild(caption); }
            
            slide.appendChild(contentBlock);
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