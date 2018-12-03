var opt = {
    canvasId : 'reversible-lane-graph',
    updateCycle : '11:00 ~ 11:15',
    showStatus : false,
    trafficData : [
        {
            flow : 8202,
            saturation : 0.85,
            direction : 'north',
            condition : 'congest'
        },{
            flow : 4060,
            saturation : 0.50,
            direction : 'west',
            condition : 'clear'
        },{
            flow : 1005,
            saturation : 0.68,
            direction : 'east',
            condition : 'normal'
        }
    ]
}

var opt2 = {
    canvasId : 'reversible-lane-graph',
    trafficData : [
        {
            flow : 2060,
            saturation : 0.50,
            direction : 'north',
            condition : 'clear'
        },{
            flow : 1005,
            saturation : 0.68,
            direction : 'east',
            condition : 'normal'
        }
    ]
}

var opt3 = [
        {
            flow : 2060,
            saturation : 0.50,
            direction : 'north',
            condition : 'clear'
        },{
            flow : 1005,
            saturation : 0.68,
            direction : 'east',
            condition : 'normal'
        }
    ]

reversibleLane.init(opt);

// setTimeout(function(){
//     reversibleLane.update(opt2)
// }, 3000)