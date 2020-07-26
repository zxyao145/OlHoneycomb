import { assert } from "ol/asserts";
import GeometryType from "ol/geom/GeometryType";
import EventType from "ol/events/EventType";
import { Vector as VectorSource } from "ol/source";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";

import Geometry from "ol/geom/Geometry";
import { AttributionLike } from "ol/source/Source";
import Point from "ol/geom/Point";
import { Extent } from "ol/extent";
import Projection from "ol/proj/Projection";

export interface Options {
  attributions?: AttributionLike;
  radius?: number;
  geometryFunction?: (p0: Feature<Geometry>) => Point;
  source?: VectorSource<Geometry>;
  wrapX?: boolean;
}

/**
 * this code modified from Openlayers Cluster
 */

export default class Honeycomb extends VectorSource {
  resolution: number | undefined;
  _radius: number;
  features: Feature[];
  geometryFunction: (feature: Feature) => Geometry;
  boundRefresh: any;

  source!: VectorSource | null;

  constructor(options: Options) {
    super({
      attributions: options.attributions,
      wrapX: options.wrapX,
    });

    this.resolution = undefined;

    this._radius = options.radius !== undefined ? (options.radius > 0 ? options.radius : 20) : 20;

    this.features = [];

    if (options.geometryFunction) {
      this.geometryFunction = options.geometryFunction;
    } else {
      this.geometryFunction = (feature: Feature) => {
        const geometry = feature.getGeometry();
        assert(geometry.getType() === GeometryType.POINT, 10); // The default `geometryFunction` can only handle `Point` geometries
        return geometry;
      };
    }

    this.boundRefresh = this.refresh.bind(this);
    this.setSource(options.source || null);
  }

  /**
   * @override
   */
  clear(optFast: boolean | undefined = false) {
    this.features.length = 0;
    super.clear(optFast);
  }

  get radius() {
    return this._radius;
  }

  set radius(vlaue) {
    if (vlaue && vlaue > 0) {
      this._radius = vlaue;
      this.refresh();
    }
  }

  /**
   * Get the distance in pixels between clusters.
   * @return {number} Distance.
   * @api
   */
  getRadius() {
    return this._radius;
  }

  /**
   * Set the distance in pixels between clusters.
   * @param {number} radius The distance in pixels.
   * @api
   */
  setRadius(radius: number) {
    this._radius = radius;
  }

  /**
   * Get a reference to the wrapped source.
   * @return {VectorSource} Source.
   * @api
   */
  getSource() {
    return this.source;
  }

  /**
   * @inheritDoc
   */
  loadFeatures(extent: Extent, resolution: number, projection: Projection) {
    if (this.source) {
      this.source.loadFeatures(extent, resolution, projection);
      if (resolution !== this.resolution) {
        this.clear();
        this.resolution = resolution;
        this.cluster();
        this.addFeatures(this.features);
      }
    }
  }

  /**
   * Replace the wrapped source.
   * @param {VectorSource} source The new source for this instance.
   * @api
   */
  setSource(source: VectorSource | null) {
    if (this.source) {
      this.source.removeEventListener(EventType.CHANGE, this.boundRefresh);
    }
    this.source = source;
    if (source) {
      source.addEventListener(EventType.CHANGE, this.boundRefresh);
    }
    this.refresh();
  }

  /**
   * Handle the source changing.
   * @override
   */
  refresh() {
    this.clear();
    this.cluster();
    this.addFeatures(this.features);
  }

  /**
   * @protected
   */
  cluster() {
    this.createHoneycomb();
  }

  createHoneycomb() {
    if (this.resolution === undefined || !this.source) {
      return;
    }

    const extent = this.source.getExtent();
    // this._radius 六边形外接圆半径
    // 半径
    const radius = this._radius * this.resolution;
    // 半径的一半
    const halfR = radius >> 1;
    // 行高
    const rowH = radius + halfR;
    // 列宽的一半
    const halfW = radius * Math.sin(Math.PI / 3);
    const colW = halfW << 1;

    let [minx, miny] = extent;
    minx -= halfW;
    miny -= radius;

    const features = this.source.getFeatures();

    const clusterDict = new Map();

    for (let i = 0, ii = features.length; i < ii; i++) {
      const feature = features[i];
      const geometry = this.geometryFunction(feature);
      if (geometry) {
        // 获取当前点
        const coordinates = (geometry as Point).getCoordinates();
        const [ptX, ptY] = coordinates;
        let mayRow = Math.floor((ptY - miny) / rowH);
        const pxPy = (mayRow & 1) === 0 ? ptX : ptX + halfW;
        const mayCol = Math.floor((pxPy - minx) / colW);

        const curRowBottom = mayRow * rowH + miny;
        const disputeBottom = curRowBottom + radius;

        // 处于争议区
        if (ptY > disputeBottom) {
          const disputeTop = disputeBottom + halfR;

          const curLeft = mayCol * colW;
          const curCenterX = curLeft + halfW;
          const curRight = curLeft + colW;

          const trangle: Array<Array<number>> = [
            [curCenterX, disputeTop],
            [curRight, disputeBottom],
            [curLeft, disputeBottom],
          ];
          if (!this.containsPoint(trangle, coordinates)) {
            mayRow += 1;
          }
        }

        const [col, row] = [mayCol, mayRow];
        const key = col + "-" + row;

        if (!clusterDict.has(key)) {
          const fe = this.createHoneycombByColRow(col, row, minx, miny, colW, rowH, radius, halfR, halfW);

          clusterDict.set(key, {
            feature: fe,
            features: [feature],
          });
        } else {
          clusterDict.get(key).features.push(feature);
        }
      }
    }

    const curClusterFeatures: Array<Feature> = [];

    clusterDict.forEach((featureInfo: any, key: any) => {
      const curFeature = featureInfo.feature;
      curFeature.set("features", featureInfo.features);
      curClusterFeatures.push(curFeature);
    });

    this.features = curClusterFeatures;
  }

  containsPoint(points: Array<Array<number>>, pt: Array<number>) {
    // 乘积
    let product: number | null = null;
    for (let i = 0; i < 3; i++) {
      const point = points[i];
      const nextPoint = points[i % 2];

      const vectorA = [pt[0] - point[0], pt[1] - point[1]];
      const vectorB = [nextPoint[0] - pt[0], nextPoint[1] - pt[1]];

      let r = vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0];
      if (r === 0) {
        product = 0;
        break;
      }

      r = r > 0 ? 1 : -1;

      if (i === 0) {
        product = r;
      } else {
        product! *= r;
      }
    }
    if (product! < 0) {
      return false;
    }
    return true;
  }

  createHoneycombByColRow(
    col: number,
    row: number,
    minX: number,
    minY: number,
    colW: number,
    rowH: number,
    r: number,
    halfR: number,
    halfW: number,
  ) {
    const y1 = row * rowH + minY;
    let x1 = col * colW + minX;
    if ((row & 1) === 1) {
      x1 -= halfW;
    }
    const center = x1 + halfW;
    const right = center + halfW;
    const top2 = y1 + r;

    const points = [
      [x1, y1],
      [center, y1 - halfR],
      [right, y1],
      [right, top2],
      [center, top2 + halfR],
      [x1, top2],
    ];

    const polygon = new Polygon([points]);

    const cluster = new Feature({
      geometry: polygon,
    });
    return cluster;
  }
}
