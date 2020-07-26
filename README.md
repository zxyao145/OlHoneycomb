# OlHoneycomb

Openlayers honeycomb layer source extension.

[Live Demo](https://zxyao145.github.io/OlHoneycomb/)



# Effect

![effect](https://github.com/zxyao145/OlHoneycomb/raw/main/images/OlHoneycomb.png)



# Usage

Like using cluster：

** install **

``` bash
npm i olhoneycomb
```

&nbsp; 

** import and using ** 

```typescript
import Honeycomb from "Honeycomb"

const source = new VectorSource({ features: features });

let honeycombSource = new Honeycomb({
  radius: 40,
  source: source,
});

let honeycombLayer = new VectorLayer({
  source: honeycombSource,
  style: function(fe) {        
    var size = fe.get('features').length;
    //Perform style calculation
    
    //rerurn style
});
```

For example, see **demo/src/index.js**



# Implementation principle

See my post: https://www.zxyao.net/Essays/Details/ZhengLiuBianXingKongJianJuLei