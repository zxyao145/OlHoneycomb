import { Vector as VectorSource } from "ol/source";
import Feature from "ol/Feature";
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
    source: VectorSource | null;
    constructor(options: Options);
    /**
     * @override
     */
    clear(optFast?: boolean | undefined): void;
    get radius(): number;
    set radius(vlaue: number);
    /**
     * Get the distance in pixels between clusters.
     * @return {number} Distance.
     * @api
     */
    getRadius(): number;
    /**
     * Set the distance in pixels between clusters.
     * @param {number} radius The distance in pixels.
     * @api
     */
    setRadius(radius: number): void;
    /**
     * Get a reference to the wrapped source.
     * @return {VectorSource} Source.
     * @api
     */
    getSource(): VectorSource<Geometry> | null;
    /**
     * @inheritDoc
     */
    loadFeatures(extent: Extent, resolution: number, projection: Projection): void;
    /**
     * Replace the wrapped source.
     * @param {VectorSource} source The new source for this instance.
     * @api
     */
    setSource(source: VectorSource | null): void;
    /**
     * Handle the source changing.
     * @override
     */
    refresh(): void;
    /**
     * @protected
     */
    cluster(): void;
    createHoneycomb(): void;
    containsPoint(points: Array<Array<number>>, pt: Array<number>): boolean;
    createHoneycombByColRow(col: number, row: number, minX: number, minY: number, colW: number, rowH: number, r: number, halfR: number, halfW: number): Feature<Geometry>;
}
