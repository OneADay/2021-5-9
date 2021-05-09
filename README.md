# oneAday

![animation](./output/render.gif?raw=true)

create a new repo
```
gh repo create {OrgName}/{YYYY-M-D}
```

watch on `localhost:9000`
```
npm run watch
```

To get mp4 render png sequence and run:
```
ffmpeg -r 24 -f image2 -pattern_type glob -i "*?png" -vcodec libx264 -crf 20 -pix_fmt yuv420p output.mp4
```