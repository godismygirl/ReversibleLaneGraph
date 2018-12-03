var reversibleLane = {
    settings : {
        showStatus : true, //是否显示路况
        canvasId : '',
        padding : 50,
        laneGap : 15,
        arrowWidth : 20,
        color : {
            background : '#212121',
            viewport : '#343232',
            border : '#171717',
            legend : '#fff',
            clear : '#4caf50',
            lane : '#7986cb',
            normal : '#ffd54f',
            slow : '#ec7034',
            congest : '#e3362a',
            flow : '#fff',
        },
        errorType : {
            direction : 'invalid direction type'
        }
    },

    el : {},
    data : {},

    draw : function(){
        this.drawViewport();
        this.settings.showStatus && this.drawLegend();
        this.drawTrafficStatus();
        this.drawCycleText();
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

    drawCycleText : function(){
        var str = this.settings.updateCycle;
        if(str && typeof str == 'string' ){
            var startX = this.getPadding() + 14;
            var t = new zrender.Text({
                style : {
                    text: '周期 ' +　reversibleLane.settings.updateCycle,
                    fontSize : 13,
                    opacity : 0.6,
                    textFill : reversibleLane.settings.color.flow,
                },
                position: [startX, startX]
            });
            this.el.canvas.add(t)
        }
    },

    drawLegend : function(){
        var lengend = [
            {
                text : '畅通',
                color :　reversibleLane.settings.color.clear
            },{
                text : '缓行',
                color :　reversibleLane.settings.color.normal
            },{
                text : '拥堵',
                color :　reversibleLane.settings.color.slow
            },{
                text : '非常拥堵',
                color :　reversibleLane.settings.color.congest
            }
        ];

        var p = this.getPadding();
        var w = this.getGraphWidth();
        var y  = this.getCanvasHeight() - p + 6;

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
        
        this.data.forDraw.forEach(function(el){

            var arrow = reversibleLane.drawArrow(el);
            var lane = reversibleLane.drawLane(el, arrow.shape);
            var text = reversibleLane.drawFlowAndCongestion(el, arrow.shape);
            
            if(reversibleLane.settings.showStatus){
                var congestion = reversibleLane.drawCongestion(el, arrow.shape);
                reversibleLane.el.canvas.add(congestion);
            }
            
            reversibleLane.el.canvas.add(arrow.group);
            reversibleLane.el.canvas.add(lane);
            reversibleLane.el.canvas.add(text)

        });
    },

    drawArrow : function(laneData){

        var g = new zrender.Group();
        var p = this.getPadding();
        var w = this.getGraphWidth();
        var h = this.getGraphHeight();
        var l = (this.getGraphShortSideLength() - this.settings.padding * 2) * 0.2;
        var x, y, maskX, maskY, rad;

        switch(laneData.direction){

            case 'west': {
                x = ( p + laneData.startX ) / 2 - laneData.width / 2;
                y = p + h * 0.65;
                maskX = x + reversibleLane.settings.arrowWidth;
                maskY = y;
                rad = Math.PI / 180 * 45;
                break;
            }

            case 'east': {
                x = ( laneData.startX + laneData.width + w + p ) / 2 + laneData.width / 2;
                y = p + h * 0.55;
                maskX = x - reversibleLane.settings.arrowWidth;
                maskY = y;
                rad = Math.PI / 180 * -135;
                break;
            }

            default: {
                x = reversibleLane.data.CENTER_AXIS;
                y = p + h * 0.15;
                maskX = x;
                maskY = y + reversibleLane.settings.arrowWidth;
                rad = Math.PI / 180 * -45;
            }

        }


        var bottomRect = new zrender.Rect({
            rotation : rad,
            origin: [x, y],
            shape : {
                x : x,
                y : y,
                width : l,
                height : l
            },
            style : {
                fill : reversibleLane.settings.color.lane
            }
        });

        var topRect = new zrender.Rect({
            rotation : rad,
            origin: [maskX, maskY],
            shape : {
                x : maskX,
                y : maskY,
                width : l,
                height : l
            },
            style : {
                fill : reversibleLane.settings.color.viewport
            }
        });

        var topCover = new zrender.Rect({
            rotation : rad,
            origin: [x, y],
            shape : {
                x : x,
                y : y,
                width : laneData.width / 1.41,
                height : laneData.width / 1.41
            },
            style : {
                fill : reversibleLane.settings.color.lane
            }
        });

        var bottomCover = new zrender.Rect({ //模拟border
            rotation : rad,
            origin: [x, y],
            shape : {
                x : x - 10,
                y : y - 10,
                width : l,
                height : l
            },
            style : {
                fill : reversibleLane.settings.color.viewport
            }
        });
        g.add(bottomCover);
        g.add(bottomRect);
        g.add(topRect);
        g.add(topCover);

        return {
            group : g,
            shape : {
                x: x,
                y: y
            }
        };
    },

    drawLane : function(laneData, shape){
        var offset = laneData.width / 2;
        var laneStartY = shape.y - offset;
        var laneEndY = reversibleLane.getPadding() + reversibleLane.getGraphHeight();
        var pointsArray, textOffsetX, fontSize;

        switch(laneData.direction){
            case 'west' : {
                pointsArray = [
                    [shape.x + offset, laneStartY],
                    [laneData.startX + laneData.width, laneStartY],
                    [laneData.startX + laneData.width, laneEndY],
                    [laneData.startX, laneEndY],
                    [laneData.startX, laneStartY + laneData.width],
                    [shape.x + offset, laneStartY + laneData.width],
                    [shape.x + offset, laneStartY]
                ];
                textOffsetX = (laneData.startX - shape.x ) / 2;
                break;
            }
            case 'east' : {
                pointsArray = [
                    [shape.x - offset, laneStartY],
                    [laneData.startX, laneStartY],
                    [laneData.startX, laneEndY],
                    [laneData.startX + laneData.width, laneEndY],
                    [laneData.startX + laneData.width, laneStartY + laneData.width],
                    [shape.x - offset, laneStartY + laneData.width],
                    [shape.x - offset, laneStartY]
                ];
                textOffsetX = - ( shape.x - laneData.startX - laneData.width ) / 2;
                break;
            }
            case 'north' : {
                pointsArray = [
                    [shape.x - laneData.width / 2, shape.y + offset],
                    [shape.x + laneData.width / 2, shape.y + offset],
                    [shape.x + laneData.width / 2, laneEndY],
                    [shape.x - laneData.width / 2, laneEndY],
                    [shape.x - laneData.width / 2, shape.y + offset]
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
            }
        });

        return lane;
    },

    _createVerticalText : function(str, opt){
        var g = new zrender.Group();
        var x = opt.position[0];
        var y = opt.position[1];
        str.split('').forEach(function(el, i){
            opt.style.text = el;
            opt.position = [x, y + i*opt.style.fontSize];
            var t = new zrender.Text(opt);
            g.add(t);
        });
        return g;
    },

    _createHorizontalText : function(opt){
        return new zrender.Text(opt)
    },

    drawFlowAndCongestion : function(laneData, shape){
        console.log(laneData)
        var g = new zrender.Group();
        var w = laneData.width;
        var bottomY = this.getGraphHeight() + this.getPadding();
        var fs = parseInt(w / 3);
        var satTextWidth = fs*3;
        var flowTextWidth = fs*2;
        var satText, satNum, flowText, flowNum;

        switch (laneData.direction){
            case 'west' : {
                satText = reversibleLane._createHorizontalText({
                    style: {
                        text : '饱和度',
                        fontSize : fs,
                        fontWeight : 'bold',
                        textAlign : 'left',
                        textFill : reversibleLane.settings.color.viewport,
                    },
                    position: [shape.x + w / 2, shape.y - fs / 2],
                });

                satNum = reversibleLane._createHorizontalText({
                    style: {
                        text : laneData.saturation,
                        fontSize : fs,
                        //fontWeight : 'bold',
                        textFill : reversibleLane.settings.color.flow,
                    },
                    position: [shape.x + w / 2 + satTextWidth + 8 , shape.y - fs / 2],
                });

                break;
            }
            case 'east' : {
                satText = reversibleLane._createHorizontalText({
                    style: {
                        text : '饱和度',
                        fontSize : fs,
                        fontWeight : 'bold',
                        textAlign : 'right',
                        textFill : reversibleLane.settings.color.viewport,
                    },
                    position: [shape.x - w / 2, shape.y - fs / 2],
                });

                satNum = reversibleLane._createHorizontalText({
                    style: {
                        text : laneData.saturation,
                        fontSize : fs,
                        //fontWeight : 'bold',
                        textAlign : 'right',
                        textFill : reversibleLane.settings.color.flow,
                    },
                    position: [shape.x - w / 2 - satTextWidth - 8 , shape.y - fs / 2],
                });

                break
            }
            default : {
                satX = shape.x + w / 2;
                satY = shape.y - fs / 2;
                ta = 'left';
                satText = reversibleLane._createVerticalText('饱和度', {
                    style: {
                        fontSize : fs,
                        fontWeight : 'bold',
                        textAlign : 'right',
                        textFill : reversibleLane.settings.color.viewport,
                    },
                    position: [shape.x + fs/2, shape.y + w / 2],
                });

                satNum = reversibleLane._createHorizontalText({
                    style: {
                        text : laneData.saturation,
                        fontSize : fs,
                        //fontWeight : 'bold',
                        textFill : reversibleLane.settings.color.flow,
                    },
                    position: [shape.x + fs/2, shape.y + w / 2 + satTextWidth + 8],
                    rotation: Math.PI / 180 * -90,
                });

            }
        }

        var flowNum = reversibleLane._createHorizontalText({
            style : {
                text : laneData.flow,
                fontSize : fs,
                textAlign : 'right',
                //fontWeight : 'bold',
                textFill : reversibleLane.settings.color.flow,
            },
            position: [laneData.startX + (w+fs)/2, bottomY - 12],
            rotation: Math.PI / 180 * -90,
        });

        console.log(flowNum.getBoundingRect())

        var flowText = reversibleLane._createVerticalText( '流量', {
            style : {
                fontSize : fs,
                textAlign : 'right',
                fontWeight : 'bold',
                textFill : reversibleLane.settings.color.viewport,
            },
            position: [laneData.startX + (w+fs)/2, bottomY - 12 - flowNum.getBoundingRect().width - flowTextWidth - 8],
        });

        g.add(satText);
        g.add(satNum);
        g.add(flowNum);
        g.add(flowText);
        return g;
    },

    drawCongestion : function(laneData, shape){

        var x,y,w,h;

        var p = this.getPadding();

        switch (laneData.direction) {
            case 'west' : {
                x = p;
                y = shape.y - laneData.width / 2;
                w = shape.x - p + laneData.width / 2;
                h = laneData.width;
                break;
            }
            case 'east' : {
                x = shape.x - laneData.width / 2;
                y = shape.y - laneData.width / 2;
                w = reversibleLane.getCanvasWidth() - p - shape.x + laneData.width / 2;
                h = laneData.width;
                break;
            }
            case 'north' : {
                x = shape.x - laneData.width / 2;
                y = p;
                w = laneData.width;
                h = shape.y - p  + laneData.width / 2;
                break;
            }
            default : {
                throw reversibleLane.settings.errorType.direction
            }
        }

        var maskCircle = new zrender.Circle({
            shape : {
                x : shape.x,
                y : shape.y,
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


    setGraphSize : function(){
        this.data.graphWidth = this.getCanvasWidth() - 2 * this.getPadding();
        var h = this.getCanvasHeight() - 2 * this.getPadding();
        this.data.graphHeight = this.settings.showStatus ? h - 15 : h;
    },

    setLaneWidth : function(){
        var computedLaneWidth = (reversibleLane.getGraphShortSideLength() - reversibleLane.settings.padding * 2) * 0.12;
        var presetLaneWidth = reversibleLane.settings.laneWidth && parseInt(reversibleLane.settings.laneWidth);
        var laneWidth = presetLaneWidth ? presetLaneWidth : computedLaneWidth;
        reversibleLane.data.forDraw.forEach(function(el){
            el.width = laneWidth;
        });
    },

    setLaneStartX : function(){

        this.data.forDraw.forEach(function(el){
  
            switch(el.direction){
                case 'north' : {
                    el.startX = reversibleLane.data.CENTER_AXIS - el.width / 2;
                    break;
                }
                case 'west' : {
                    el.startX = reversibleLane.data.CENTER_AXIS - el.width / 2 - reversibleLane.settings.laneGap - el.width ;
                    break;
                }
                case 'east' : {
                    el.startX = reversibleLane.data.CENTER_AXIS + el.width / 2 + reversibleLane.settings.laneGap ;
                    break;
                }
                default : {
                    throw 'has invalid direction type'
                }
                    
            }
        });

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