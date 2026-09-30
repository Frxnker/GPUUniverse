# Three.js (copia local para el visor 3D)

`three-viewer.min.js` es **Three.js 0.186.1** (licencia MIT, ver `LICENSE`) reducido a lo que usa
`js/learn-3d.js`: las clases exportadas en `entry.js` y `OrbitControls` del mismo paquete.

Se guarda en el repositorio para que la web no dependa de ningún CDN y funcione sin conexión.
No hace falta compilar nada para usar la web; esto solo se repite al actualizar Three.js
o si el visor necesita otra clase (añádela a `entry.js`):

```sh
# en una carpeta temporal, fuera del proyecto
npm pack three@0.186.1 && tar xzf three-0.186.1.tgz && mkdir -p node_modules && mv package node_modules/three
cp /ruta/a/GPUUniverse/vendor/three/entry.js .
npx esbuild@0.25 entry.js --bundle --minify --format=esm --legal-comments=inline --outfile=three-viewer.min.js
```
