var reversibleLane = {
    settings : {
        canvasId : '',
        padding : 50,
        laneGap : 10,
        color : {
            background : '#212121',
            viewport : '#343232',
            border : '#171717',
            legend : '#fff',
            clear : '#4caf50',
            lane : '#7986cb',
            normal : '#ffd54f',
            congest : '#f44336',
            saturation : '#7986cb',
            flow : '#fff',
        },
        errorType : {
            direction : 'invalid direction type'
        }
    },

    el : {},
    data : {},

    getCenterAxis : function(trafficData){
        var CENTER_AXIS = this.getCanvasWidth() / 2;
        var offsetWidth = ( this.getCanvasWidth() - this.getPadding() * 2 ) / 8;
        var offset = 0;
        trafficData.forEach(function(el, i){
            if(el.direction === 'west'){
                offset = offset + 1;
            }
            if(el.direction === 'east'){
                offset = offset - 1;
            }
        });
        CENTER_AXIS = CENTER_AXIS + offset * offsetWidth;
        return CENTER_AXIS;
    },

    draw : function(){
        this.drawViewport();
        this.drawLegend();
        this.drawTrafficStatus();
        this.drawFrameBorder();
    },

    drawFrameBorder : function(){
        var p = this.getPadding();
        var w = this.getGraphWidth();
        var h = this.getGraphHeight();
        var frameBorder = new zrender.Polyline({
            shape : {
                points : [
                    [p,p],
                    [p+w, p],
                    [p+w, p+h],
                    [p, p+h],
                    [p,p]
                ]
            },
            style : {
                stroke : reversibleLane.settings.color.border,
                lineWidth : 2
            }
        });

        this.el.canvas.add(frameBorder);
    },

    drawViewport : function(){
        var p = this.getPadding();
        var w = this.getCanvasWidth();
        var h = this.getCanvasHeight();
        var canvas = this.el.canvas;
        var viewport = new zrender.Rect({
            shape : {
                x : 0,
                y : 0,
                width : w,
                height : h
            },
            style : {
                fill : reversibleLane.settings.color.background
            }
        });

        var chartBackground = new zrender.Rect({
            shape : {
                x : p,
                y : p,
                width : reversibleLane.getGraphWidth(),
                height : reversibleLane.getGraphHeight()
            },
            style : {
                fill : reversibleLane.settings.color.viewport,
            }
        });

        canvas.add(viewport);
        canvas.add(chartBackground);
    },

    drawLegend : function(){
        var lengend = [
            {
                text : '畅通',
                color :　reversibleLane.settings.color.clear
            },{
                text : '拥堵',
                color :　reversibleLane.settings.color.normal
            },{
                text : '非常拥堵',
                color :　reversibleLane.settings.color.congest
            },{
                text : '饱和度',
                color :　reversibleLane.settings.color.saturation
            }
        ];

        var p = this.getPadding();
        var w = this.getGraphWidth();
        var y  = this.getCanvasHeight() - p;

        lengend.forEach(function(el, i){
            var label = new zrender.Circle({
                shape : {
                    cx : i / 4 * w + p + w / 30,
                    cy : y,
                    r : 5
                },
                style : {
                    fill : el.color,
                    shadowColor : '#000',
                    shadowBlur : 6,
                    lineWidth : 2,
                    text : el.text,
                    textFill : reversibleLane.settings.color.legend,
                    textPosition : 'right'
                }
            });

            reversibleLane.el.canvas.add(label);
        });
    },

    drawTrafficStatus : function(){

        var hasAllDirection = this.settings.trafficData.length === 3 ? true : false;
        
        this.data.forDraw.forEach(function(el){

            var saturationCircle = reversibleLane.drawSaturation(el);
            var lane = reversibleLane.drawLane(el, saturationCircle.shape);
            var congestion = reversibleLane.drawCongestion(el, saturationCircle.shape);

            reversibleLane.el.canvas.add(congestion);
            reversibleLane.el.canvas.add(lane);
            reversibleLane.el.canvas.add(saturationCircle);

        });
    },

    drawSaturation : function(laneData){

        var saturationCX;
        var saturationCY;
        //var saturationR = (this.getMaxLaneWidth() + this.settings.laneGap) /2 ;
        var saturationR = laneData.width / 2 + this.settings.laneGap *1.2 ;

        var p = this.getPadding();
        var w = this.getGraphWidth();
        var h = this.getGraphHeight();

        switch(laneData.direction){
            case 'west' : {
                saturationCX = ( p + laneData.startX ) / 2 + reversibleLane.settings.laneGap;
                saturationCY = p + h * 0.6;
                break;
            }
            case 'east' : {
                saturationCX = ( laneData.startX + laneData.width + w + p ) / 2 - reversibleLane.settings.laneGap;
                saturationCY = p + h * 0.45;
                break;
            }
            case 'north' : {
                saturationCX = reversibleLane.data.CENTER_AXIS;
                saturationCY = p + h * 0.25;
                break;
            }
            default : {
                throw reversibleLane.settings.errorType.direction
            }
        }

        var saturation = new zrender.Circle({
            shape : {
                cx : saturationCX,
                cy : saturationCY,
                r : saturationR,
            },
            style : {
                fill : reversibleLane.settings.color.viewport,
                stroke : reversibleLane.settings.color.lane,
                lineWidth : parseInt(saturationR / 3 ),
                shadowColor : reversibleLane.settings.color.border,
                shadowBlur : 8,
                shadowOffsetY : 2,
                text : laneData.saturation.toFixed(2),
                fontFamily : 'Arial',
                fontSize :  parseInt( saturationR / 1.8 ),
                textFill : reversibleLane.settings.color.lane,
                textShadowColor : reversibleLane.settings.color.border,
                textShadowBlur : 4,
                textShadowOffsetY : 1,
            }
        });

        return saturation;
    },

    getMaxLaneWidth : function(){
        var maxWidth = 0;
        this.data.forDraw.forEach(function(el){
            if(el.width > maxWidth){
                maxWidth = el.width;
            }
        });
        return maxWidth;
    },

    drawLane : function(laneData, shape){

        var laneStartY = shape.cy - laneData.width / 2;
        var laneEndY = reversibleLane.getPadding() + reversibleLane.getGraphHeight();
        var pointsArray, textOffsetX, fontSize;

        switch(laneData.direction){
            case 'west' : {
                pointsArray = [
                    [shape.cx, laneStartY],
                    [laneData.startX + laneData.width, laneStartY],
                    [laneData.startX + laneData.width, laneEndY],
                    [laneData.startX, laneEndY],
                    [laneData.startX, laneStartY + laneData.width],
                    [shape.cx, laneStartY + laneData.width],
                    [shape.cx, laneStartY]
                ];
                textOffsetX = (laneData.startX - shape.cx ) / 2;
                break;
            }
            case 'east' : {
                pointsArray = [
                    [shape.cx, laneStartY],
                    [laneData.startX, laneStartY],
                    [laneData.startX, laneEndY],
                    [laneData.startX + laneData.width, laneEndY],
                    [laneData.startX + laneData.width, laneStartY + laneData.width],
                    [shape.cx, laneStartY + laneData.width],
                    [shape.cx, laneStartY]
                ];
                textOffsetX = - ( shape.cx - laneData.startX - laneData.width ) / 2;
                break;
            }
            case 'north' : {
                pointsArray = [
                    [shape.cx - laneData.width / 2, shape.cy],
                    [shape.cx + laneData.width / 2, shape.cy],
                    [shape.cx + laneData.width / 2, laneEndY],
                    [shape.cx - laneData.width / 2, laneEndY],
                    [shape.cx - laneData.width / 2, shape.cy]
                ];
                textOffsetX = 0;
                break;
            }
            default : {
                throw reversibleLane.settings.errorType.direction;
            }
        }
        

        var lane = new zrender.Polyline({
            shape : {
                points : pointsArray
            },
            style : {
                stroke : 'transparent',
                fill : reversibleLane.settings.color.lane,
                shadowColor : reversibleLane.settings.color.border,
                shadowBlur : 10,
                shadowOffsetY : 2,
                text : laneData.flow + ' 辆',
                textFill : reversibleLane.settings.color.flow,
                textPosition : 'bottom',
                textRotation : -90 * Math.PI / 180,
                textVerticalAlign : 'middle',
                textOffset : [textOffsetX, 0],
                textAlign : 'right',
                textDistance : -15,
                fontSize : laneData.width * 0.7 > 24? 24 : parseInt(laneData.width * 0.7),
                textShadowColor : reversibleLane.settings.color.border,
                textShadowBlur : 3,
                textShadowOffsetY : 1,
            }
        });

        return lane;
    },

    drawCongestion : function(laneData, shape){

        var x,y,w,h;

        var p = this.getPadding();

        switch (laneData.direction) {
            case 'west' : {
                x = p;
                y = shape.cy - laneData.width / 2;
                w = shape.cx - p;
                h = laneData.width;
                break;
            }
            case 'east' : {
                x = shape.cx;
                y = shape.cy - laneData.width / 2;
                w = reversibleLane.getCanvasWidth() - p - shape.cx;
                h = laneData.width;
                break;
            }
            case 'north' : {
                x = shape.cx - laneData.width / 2;
                y = p;
                w = laneData.width;
                h = shape.cy - p;
                break;
            }
            default : {
                throw reversibleLane.settings.errorType.direction
            }
        }

        var maskCircle = new zrender.Circle({
            shape : {
                cx : shape.cx,
                cy : shape.cy,
                r : shape.r *1.3,
            },
            style : {
                fill : reversibleLane.settings.color.viewport,
            }
        });

        var congestionRect = new zrender.Rect({
            shape : {
                x : x,
                y : y,
                width : w,
                height : h,
            },
            style : {
                fill : reversibleLane.settings.color[laneData.condition],
                shadowColor : reversibleLane.settings.color.border,
                shadowBlur : 8,
                shadowOffsetY : 2,
            }
        });

        var g = new zrender.Group();
        g.add(congestionRect);
        g.add(maskCircle);

        return g;
    },

    getTotalFlow : function(flowArray){
        var total = 0;
        flowArray.forEach(function(el){
            total = total + el;
        });
        return total;
    },

    initCanvas : function(){
        var el = document.getElementById(reversibleLane.settings.canvasId);
        this.el.canvas = zrender.init(el);
        return this;
    },

    initData : function(trafficData){  
        this.data.CENTER_AXIS = this.getCenterAxis(trafficData);
        this.data.forDraw = zrender.util.clone(reversibleLane.settings.trafficData);
        this.setGraphSize();
        this.setLaneWidth();
        this.setLaneStartX();
    },

    setGraphSize : function(){
        this.data.graphWidth = this.getCanvasWidth() - 2 * this.getPadding();
        this.data.graphHeight = this.getCanvasHeight() - 2 * this.getPadding() - 25;
    },

    setLaneWidth : function(){
        var threshold = 3;
        var widthArray = [];
        var flowArray = [];
        var trafficData = this.data.forDraw;
        var MIN_LENGTH = this.getGraphShortSideLength();
        var TOTAL_LANE_WIDTH = trafficData.length === 3 ? MIN_LENGTH / 4 : MIN_LENGTH / 5;

        var max = parseInt(trafficData[0].flow);
        var maxIndex = 0;
        trafficData.forEach(function(el, i){
            var flow = parseInt(el.flow);
            if(flow > max ){
                max = flow;
                maxIndex = i;
            }
            flowArray.push(flow);
        });

        flowArray.forEach(function(el, i){
            if(el * threshold < max){
                flowArray[i] = parseInt(max / threshold);
            }
        });

        var TOTAL_FLOW = this.getTotalFlow(flowArray);

        flowArray.forEach(function(el, i){
            reversibleLane.data.forDraw[i].width = parseInt(flowArray[i] / TOTAL_FLOW * TOTAL_LANE_WIDTH)
        });
    },

    setLaneStartX : function(){

        var northLaneWidth = this.getNorthLaneWidth();
        this.data.forDraw.forEach(function(el){
  
            switch(el.direction){
                case 'north' : {
                    el.startX = reversibleLane.data.CENTER_AXIS - el.width / 2;
                    break;
                }
                case 'west' : {
                    el.startX = reversibleLane.data.CENTER_AXIS - northLaneWidth / 2 - reversibleLane.settings.laneGap - el.width ;
                    break;
                }
                case 'east' : {
                    el.startX = reversibleLane.data.CENTER_AXIS + northLaneWidth / 2 + reversibleLane.settings.laneGap ;
                    break;
                }
                default : {
                    throw 'has invalid direction type'
                }
                    
            }
        });

    },

    getNorthLaneWidth : function(){
        var northLaneWidth = 0;
        this.data.forDraw.forEach(function(el){
            if(el.direction === 'north'){
                northLaneWidth = el.width;
            }
        });
        return northLaneWidth;
    },

    getNorthLaneRatio : function(){
        var ratio = 0;
        this.data.forDraw.forEach(function(el){
            if(el.direction === 'west'){
                ratio = ratio + 1;
            }
            if(el.direction === 'east'){
                ratio = ratio - 1;
            }
        });
        return ratio;
    },

    resize : function(opt){
        TDGraph.el.canvas.resize(opt);
    },

    getPadding : function(){
        return parseInt(reversibleLane.settings.padding)
    },

    getCanvasWidth : function(){
        return reversibleLane.el.canvas.getWidth();
    },

    getCanvasHeight : function(){
        return reversibleLane.el.canvas.getHeight();
    },

    getGraphWidth : function(){
        return reversibleLane.data.graphWidth;
    },

    getGraphHeight : function(){
        return reversibleLane.data.graphHeight;
    },

    getGraphShortSideLength : function(){
        var w = this.getGraphWidth();
        var h = this.getCanvasHeight();
        return w > h ? h : w;
    },

    getGraphLongSideLength : function(){
        var w = this.getGraphWidth();
        var h = this.getCanvasHeight();
        return w < h ? h : w;
    },

    update : function(trafficData){
        this.el.canvas.clear();
        this.settings.trafficData = trafficData;
        this.initCanvas();
        this.initData(trafficData);
        this.draw();
    },

    init : function(config){
        this.settings = zrender.util.merge(reversibleLane.settings, config, true);
        this.initCanvas();
        this.initData(config.trafficData);
        this.draw();
    }
}