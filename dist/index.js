"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("ol/asserts");
var GeometryType_1 = __importDefault(require("ol/geom/GeometryType"));
var EventType_1 = __importDefault(require("ol/events/EventType"));
var source_1 = require("ol/source");
var Feature_1 = __importDefault(require("ol/Feature"));
var Polygon_1 = __importDefault(require("ol/geom/Polygon"));
/**
 * this code modified from Openlayers Cluster
 */
var Honeycomb = /** @class */ (function (_super) {
    __extends(Honeycomb, _super);
    function Honeycomb(options) {
        var _this = _super.call(this, {
            attributions: options.attributions,
            wrapX: options.wrapX,
        }) || this;
        _this.resolution = undefined;
        _this._radius = options.radius !== undefined ? (options.radius > 0 ? options.radius : 20) : 20;
        _this.features = [];
        if (options.geometryFunction) {
            _this.geometryFunction = options.geometryFunction;
        }
        else {
            _this.geometryFunction = function (feature) {
                var geometry = feature.getGeometry();
                asserts_1.assert(geometry.getType() === GeometryType_1.default.POINT, 10); // The default `geometryFunction` can only handle `Point` geometries
                return geometry;
            };
        }
        _this.boundRefresh = _this.refresh.bind(_this);
        _this.setSource(options.source || null);
        return _this;
    }
    /**
     * @override
     */
    Honeycomb.prototype.clear = function (optFast) {
        if (optFast === void 0) { optFast = false; }
        this.features.length = 0;
        _super.prototype.clear.call(this, optFast);
    };
    Object.defineProperty(Honeycomb.prototype, "radius", {
        get: function () {
            return this._radius;
        },
        set: function (vlaue) {
            if (vlaue && vlaue > 0) {
                this._radius = vlaue;
                this.refresh();
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Get the distance in pixels between clusters.
     * @return {number} Distance.
     * @api
     */
    Honeycomb.prototype.getRadius = function () {
        return this._radius;
    };
    /**
     * Set the distance in pixels between clusters.
     * @param {number} radius The distance in pixels.
     * @api
     */
    Honeycomb.prototype.setRadius = function (radius) {
        this._radius = radius;
    };
    /**
     * Get a reference to the wrapped source.
     * @return {VectorSource} Source.
     * @api
     */
    Honeycomb.prototype.getSource = function () {
        return this.source;
    };
    /**
     * @inheritDoc
     */
    Honeycomb.prototype.loadFeatures = function (extent, resolution, projection) {
        if (this.source) {
            this.source.loadFeatures(extent, resolution, projection);
            if (resolution !== this.resolution) {
                this.clear();
                this.resolution = resolution;
                this.cluster();
                this.addFeatures(this.features);
            }
        }
    };
    /**
     * Replace the wrapped source.
     * @param {VectorSource} source The new source for this instance.
     * @api
     */
    Honeycomb.prototype.setSource = function (source) {
        if (this.source) {
            this.source.removeEventListener(EventType_1.default.CHANGE, this.boundRefresh);
        }
        this.source = source;
        if (source) {
            source.addEventListener(EventType_1.default.CHANGE, this.boundRefresh);
        }
        this.refresh();
    };
    /**
     * Handle the source changing.
     * @override
     */
    Honeycomb.prototype.refresh = function () {
        this.clear();
        this.cluster();
        this.addFeatures(this.features);
    };
    /**
     * @protected
     */
    Honeycomb.prototype.cluster = function () {
        this.createHoneycomb();
    };
    Honeycomb.prototype.createHoneycomb = function () {
        if (this.resolution === undefined || !this.source) {
            return;
        }
        var extent = this.source.getExtent();
        // this._radius 六边形外接圆半径
        // 半径
        var radius = this._radius * this.resolution;
        // 半径的一半
        var halfR = radius >> 1;
        // 行高
        var rowH = radius + halfR;
        // 列宽的一半
        var halfW = radius * Math.sin(Math.PI / 3);
        var colW = halfW << 1;
        var minx = extent[0], miny = extent[1];
        minx -= halfW;
        miny -= radius;
        var features = this.source.getFeatures();
        var clusterDict = new Map();
        for (var i = 0, ii = features.length; i < ii; i++) {
            var feature = features[i];
            var geometry = this.geometryFunction(feature);
            if (geometry) {
                // 获取当前点
                var coordinates = geometry.getCoordinates();
                var ptX = coordinates[0], ptY = coordinates[1];
                var mayRow = Math.floor((ptY - miny) / rowH);
                var pxPy = (mayRow & 1) === 0 ? ptX : ptX + halfW;
                var mayCol = Math.floor((pxPy - minx) / colW);
                var curRowBottom = mayRow * rowH + miny;
                var disputeBottom = curRowBottom + radius;
                // 处于争议区
                if (ptY > disputeBottom) {
                    var disputeTop = disputeBottom + halfR;
                    var curLeft = mayCol * colW;
                    var curCenterX = curLeft + halfW;
                    var curRight = curLeft + colW;
                    var trangle = [
                        [curCenterX, disputeTop],
                        [curRight, disputeBottom],
                        [curLeft, disputeBottom],
                    ];
                    if (!this.containsPoint(trangle, coordinates)) {
                        mayRow += 1;
                    }
                }
                var _a = [mayCol, mayRow], col = _a[0], row = _a[1];
                var key = col + "-" + row;
                if (!clusterDict.has(key)) {
                    var fe = this.createHoneycombByColRow(col, row, minx, miny, colW, rowH, radius, halfR, halfW);
                    clusterDict.set(key, {
                        feature: fe,
                        features: [feature],
                    });
                }
                else {
                    clusterDict.get(key).features.push(feature);
                }
            }
        }
        var curClusterFeatures = [];
        clusterDict.forEach(function (featureInfo, key) {
            var curFeature = featureInfo.feature;
            curFeature.set("features", featureInfo.features);
            curClusterFeatures.push(curFeature);
        });
        this.features = curClusterFeatures;
    };
    Honeycomb.prototype.containsPoint = function (points, pt) {
        // 乘积
        var product = null;
        for (var i = 0; i < 3; i++) {
            var point = points[i];
            var nextPoint = points[i % 2];
            var vectorA = [pt[0] - point[0], pt[1] - point[1]];
            var vectorB = [nextPoint[0] - pt[0], nextPoint[1] - pt[1]];
            var r = vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0];
            if (r === 0) {
                product = 0;
                break;
            }
            r = r > 0 ? 1 : -1;
            if (i === 0) {
                product = r;
            }
            else {
                product *= r;
            }
        }
        if (product < 0) {
            return false;
        }
        return true;
    };
    Honeycomb.prototype.createHoneycombByColRow = function (col, row, minX, minY, colW, rowH, r, halfR, halfW) {
        var y1 = row * rowH + minY;
        var x1 = col * colW + minX;
        if ((row & 1) === 1) {
            x1 -= halfW;
        }
        var center = x1 + halfW;
        var right = center + halfW;
        var top2 = y1 + r;
        var points = [
            [x1, y1],
            [center, y1 - halfR],
            [right, y1],
            [right, top2],
            [center, top2 + halfR],
            [x1, top2],
        ];
        var polygon = new Polygon_1.default([points]);
        var cluster = new Feature_1.default({
            geometry: polygon,
        });
        return cluster;
    };
    return Honeycomb;
}(source_1.Vector));
exports.default = Honeycomb;
