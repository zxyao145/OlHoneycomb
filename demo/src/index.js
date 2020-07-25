import Honeycomb from "../../dist/index"

import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import { OSM, Vector as VectorSource} from 'ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style, Text} from 'ol/style';

import * as olProj from "ol/proj";

const pointNum = 100;

const features = [];
for (let i = 0; i < pointNum; i++) {
  const x = Math.random() * 10 + 110;
  const y = Math.random() * 4 + 30;


  let pt = olProj.fromLonLat([x, y], "EPSG:3857");

  const feature = new Feature(new Point(pt));
  features.push(feature);
}

const source = new VectorSource({ features: features });

let honeycombSource = new Honeycomb({
  radius: 40,
  source: source,
});

const styleCache = {};
const colors = ["#ffa500", "blue", "red", "green", "cyan", "magenta", "yellow", "#0f0"];
//处理style配置
let honeycombs = new VectorLayer({
  source: honeycombSource,
  style: function(fe) {        
    var size = fe.get('features').length;
    let fillColor = colors[Math.ceil(size /4)] || "#0f0";
    var style = styleCache[size];
    if (!style) {
      style = new Style({
        stroke: new Stroke({
          color: '#fff',
          width: 0
        }),
        fill: new Fill({
          color: fillColor
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff'
          }),
          font: '18px sans-serif'
        })
      });
      styleCache[size] = style;
    }
    return style;
  }
});


const raster = new TileLayer({
  source: new OSM()
});

let center = [114.296845, 32];

center = olProj.fromLonLat(center, "EPSG:3857");

window.map = new Map({
  layers: [raster, honeycombs],
  target: 'map',
  view: new View({
    center: center,
    maxZoom: 19,
    zoom: 8
  })
});