import * as seedrandom from 'seedrandom';
import { BaseRenderer } from './baseRenderer';
import gsap from 'gsap';
import P5 from 'p5';

const srandom = seedrandom('b');

export default class P5Renderer implements BaseRenderer{

    recording: boolean = false;
    colors = ['#AA4465', '#861657', '#93E1D8', '#DDFFF7'];
    backgroundColor = '#FFA69E';

    canvas: HTMLCanvasElement;
    s: any;

    completeCallback: any;
    delta = 0;
    animating = true;

    width: number = 1920 / 2;
    height: number = 1080 / 2;

    size: number;

    x: number;
    y: number;

    frameCount = 0;
    totalFrames = 1000;

    constructor(w, h) {

        this.width = w;
        this.height = h;

        const sketch = (s) => {
            this.s = s;
            s.pixelDensity(1);
            s.setup = () => this.setup(s)
            s.draw = () => this.draw(s)
        }

        new P5(sketch);
    }

    protected setup(s) {
        let renderer = s.createCanvas(this.width, this.height);
        this.canvas = renderer.canvas;

        s.noiseSeed(99);
        let bg = s.color(this.backgroundColor);
        s.background(bg);
        s.rectMode(s.CENTER);

        //s.colorMode(s.HSB);
    }

    protected draw(s) {
        console.log('/////');

        if (this.animating) { 
            this.frameCount += 5;

            let frameDelta = 2 * Math.PI * (this.frameCount % this.totalFrames) / this.totalFrames;

            //s.colorMode(s.RGB);
            let bg = s.color(this.backgroundColor);
            s.background(bg);

            let x = 0;
            let y = 0;
            //s.colorMode(s.HSB);

            while (y < this.height + 1) {

                s.noFill();

                let pct = y / this.height;

                let colorA = s.color(this.colors[0]);
                let colorB = s.color(this.colors[2]);
                let color = s.lerpColor(colorA, colorB, pct);
                
                s.stroke(color);
                s.strokeWeight(12);
                s.beginShape();

                while (x < this.width + 2) {

                    let _x = x;
                    let _y = y + s.sin(frameDelta * 10 + x * 0.2) * Math.sin(frameDelta) * 10;
                    //_y = y + s.sin(s.noise(frameDelta + x, y)) * 20;

                    s.vertex(_x, _y);
                    x += 1;
                }
                s.endShape();

                x = 0;
                y += 20;

            }

            /*
            let size = 5;
            let space = 3;
            let count = 700;
            let r, 
            x1, 
            y1, 
            golden;

            s.colorMode(s.RGB);
            let bg = s.color(this.backgroundColor);
            //bg.setAlpha(10);
            s.background(bg);

            s.smooth();
            s.noStroke();

            //s.colorMode(s.HSB);

            for (let n=1; n<=count; n++) 
            {
              golden = s.radians(180*(3-s.sqrt(5))) + (Math.sin(frameDelta) * 0.001);
              r = space*s.sqrt(n) + Math.sin(frameDelta) * 2;
              x1 = s.width/2+2*r*s.cos(golden*n);
              y1 = s.height/2+2*r*s.sin(golden*n);

              let scale = Math.sin(n + frameDelta) * size;
              
              //let color = this.colors[1];
              //let offset = 0.5 + Math.sin(frameDelta) * 0.5;
              let pct = 0.5 + Math.sin(frameDelta) * n / count;
              //let hue = ((offset + n / count) * 360) % 360;
              //let color = s.color(hue, 255, 255, 255);
              let color1 = s.color(this.colors[0]);
              let color2 = s.color(this.colors[2]);
              let color = s.lerpColor(color1, color2, pct);

              s.fill(color);

              s.ellipse(x1, y1, scale, scale);
            }
            */

            if (this.recording) {
                if (frameDelta == 0) {
                    this.completeCallback();
                }
            }
        }
    }

    protected getPolar = function(x, y, r, a) {
        // Get as radians
        var fa = a * (Math.PI / 180);
        
        // Convert coordinates
        var dx = r * Math.cos(fa);
        var dy = r * Math.sin(fa);
        
        // Add origin values (not necessary)
        var fx = x + dx;
        var fy = y + dy;
    
        return [fx, fy];
    }
    

    public render() {

    }

    public play() {
        this.frameCount = 0;
        this.recording = true;
        this.animating = true;
        let bg = this.s.color(this.backgroundColor);
        this.s.background(bg);
    }

    public stop() {
        this.animating = false;
    }

    public setCompleteCallback(completeCallback: any) {
        this.completeCallback = completeCallback;
    }

    public resize() {
        this.s.resizeCanvas(window.innerWidth, window.innerHeight);
        this.s.background(0, 0, 0, 255);
    }
}