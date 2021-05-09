import * as THREE from 'three';
import { BaseRenderer } from './baseRenderer';
import * as seedrandom from 'seedrandom';
import gsap from 'gsap';
import bgVertShader from './shaders/bgVertShader.txt';
import bgFragShader from './shaders/bgFragShader.txt';
import glowVertShader from './shaders/glowVertShader.txt';
import glowFragShader from './shaders/glowFragShader.txt';
import clothVertShader from './shaders/clothVert.txt';
import clothFragShader from './shaders/clothFrag.txt';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const srandom = seedrandom('a');

let tl;

const BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

const params = {
    exposure: 1,
    bloomStrength: 3,
    bloomThreshold: 2,
    bloomRadius: 1,
    scene: "Scene with Glow"
};

const darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );
const materials = {};

export default class ThreeRenderer implements BaseRenderer{
    canvas: HTMLCanvasElement;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    mesh: THREE.Mesh;
    renderer: THREE.Renderer;
    group: THREE.Object3D;
    bg: THREE.Mesh;
    completeCallback: any;
    bloomComposer: EffectComposer;
    finalComposer: EffectComposer;

    width: number = 1920 / 2;
    height: number = 1080 / 2;

    bgUniforms: any;
    bgMaterial: any;

    dragging: boolean = false;

    constructor(w: number, h: number) {

        this.width = w;
        this.height = h;

        this.camera = new THREE.PerspectiveCamera( 70, w / h, 0.01, 1000 );
        this.camera.position.z = 1;
    
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xcccc00 );

        this.scene.add( new THREE.AmbientLight( 0x404040 ) );

        let pointLight = new THREE.PointLight( 0xffffff, 1, 1000 );
        pointLight.position.set( 0, 0, 0 );
        this.scene.add( pointLight );

        this.renderer = new THREE.WebGLRenderer( { 
            antialias: true,
            preserveDrawingBuffer: true
        } );

        this.canvas = this.renderer.domElement;
        document.body.appendChild(this.canvas);
        this.renderer.setSize( w, h );

        const renderScene = new RenderPass( this.scene, this.camera );

        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;

        this.bloomComposer = new EffectComposer( this.renderer );
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass( renderScene );
        this.bloomComposer.addPass( bloomPass );

        const finalPass = new ShaderPass(
            new THREE.ShaderMaterial( {
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader: glowVertShader,
                fragmentShader: glowFragShader,
                defines: {}
            } ), "baseTexture"
        );
        finalPass.needsSwap = true;

        this.finalComposer = new EffectComposer( this.renderer );
        this.finalComposer.addPass( renderScene );
        this.finalComposer.addPass( finalPass );

        this.bloomComposer.setSize( w, h );
        this.finalComposer.setSize( w, h );

        // ADD ITEMS HERE

        this.bgUniforms = {
            delta: {
                value: 0
            },
            resolution: {
                type: 'v2',
                value: new THREE.Vector2(this.width, this.height)
            },
            downX: {
                value: 0
            },
            downY: {
                value: 0
            },
            toX: {
                value: 0
            },
            toY: {
                value: 3
            },
            oX: {
                value: 0
            },
            oY: {
                value: 0
            },
            vX: {
                value: 0
            },
            vY: {
                value: 0  
            }
        };

        let bgGeometry = new THREE.PlaneGeometry(10, 10, 30, 30);
        
        this.bgMaterial = new THREE.ShaderMaterial({
            uniforms: this.bgUniforms,
            vertexShader: clothVertShader, 
            fragmentShader: clothFragShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            //side: THREE.DoubleSide
        }); 
              
        //let bgMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00});
        this.bg = new THREE.Mesh( bgGeometry, this.bgMaterial );
        this.bg.position.set(0, 0, -7);
        //this.bg.rotation.z = Math.PI;
        this.scene.add(this.bg);

        setInterval(() => {
            this.bgMaterial.uniforms.delta.value += 0.1;
            //this.bg.rotation.y += 0.1;
        }, 100);

        // END ADD ITEMS

        this.createTimeline();

        window.addEventListener('mousedown', (e) => {

            console.log( e.x, this.width, e.x / this.width);
            let uniforms = this.bgMaterial.uniforms;
            uniforms.downX.value = uniforms.toX.value = e.x / this.width;
            uniforms.downY.value = uniforms.toY.value = e.y / this.height;
            this.update();
            this.dragging = true;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.dragging) {
                console.log(e);

                let uniforms = this.bgMaterial.uniforms;
                uniforms.toX.value = e.x / this.width;
                uniforms.toY.value = e.y / this.height;
                this.update();
            }
        });

        window.addEventListener('mouseup', (e) => {
            this.dragging = false;
            let uniforms = this.bgMaterial.uniforms;

            gsap.to(uniforms.toY, {value: -.1, duration: 1});
            gsap.to(uniforms.downY, {value: 1, duration: 1});

        });
    }

    private update() {
        
        let params = this.bgMaterial.uniforms;
        params.vX.value += (params.toX.value - params.oX.value);
        params.oX.value = (params.oX.value + params.vX.value) * .4;
        params.vY.value += (params.toY.value - params.oY.value);
        params.oY.value = (params.oY.value + params.vY.value) * .6;
    }

    private createTimeline() {
        tl = gsap.timeline({
            repeat: -1,
            onRepeat: () => this.handleRepeat()
        });

        let uniforms = this.bgMaterial.uniforms;
        tl.to(uniforms.toX, {value: 0, duration: 0.5}, 0);
        tl.to(uniforms.toX, {value: 1, duration: 1}, 1);
        tl.to(uniforms.toY, {value: -.1, duration: 1}, 0.5);
        tl.to(uniforms.downY, {value: 1, duration: 1}, 0.5);
    }

    private handleRepeat() {
        if (this.completeCallback) {
            this.completeCallback();
        }
    }

    private handleComplete() {

    }

    public render() {
        this.renderer.render(this.scene, this.camera);

        //this.renderBloom();
        //this.finalComposer.render();
    }

    public play() {
        tl.restart();
    }

    public stop() {
        tl.pause(true);
        tl.time(0);
    }

    public setCompleteCallback(completeCallback: any) {
        this.completeCallback = completeCallback;
    }

    public resize() {
        this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.01, 10 );
        this.camera.position.z = 1;

        this.renderer.setSize( this.width, this.height );
    }

    private renderBloom() {
        this.scene.traverse( this.darkenNonBloomed );
        this.bloomComposer.render();
        this.scene.traverse( this.restoreMaterial );
    }

    private darkenNonBloomed( obj ) {
        if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
            materials[ obj.uuid ] = obj.material;
            obj.material = darkMaterial;
        }
    }

    private restoreMaterial( obj ) {
        if ( materials[ obj.uuid ] ) {
            obj.material = materials[ obj.uuid ];
            delete materials[ obj.uuid ];
        }
    }
}