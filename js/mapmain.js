var svgpath = "M3.5,13.277C3.5,6.22,9.22,0.5,16.276,0.5C23.333,0.5,29.053,6.22,29.053,13.277C29.053,14.54,28.867,15.759,28.526,16.914C26.707,24.271,16.219,32.5,16.219,32.5C16.219,32.5,4.37,23.209,3.673,15.542C3.673,15.542,3.704,15.536,3.704,15.536C3.572,14.804,3.5,14.049,3.5,13.277C3.5,13.277,3.5,13.277,3.5,13.277M16.102,16.123C18.989,16.123,21.329,13.782,21.329,10.895C21.329,8.008,18.989,5.668,16.102,5.668C13.216,5.668,10.876,8.008,10.876,10.895C10.876,13.782,13.216,16.123,16.102,16.123C16.102,16.123,16.102,16.123,16.102,16.123";
AmCharts.makeChart("map",{
	"type": "map",
	"pathToImages": "http://www.amcharts.com/lib/3/images/",
	"addClassNames": true,
	"fontSize": 15,
	"color": "#FFFFFF",
	"projection": "mercator",
	"backgroundAlpha": 1,
	"backgroundColor": "rgba(200,220,255,.9)",
	"dataProvider": {
		"map": "worldLow",
		"getAreasFromMap": true,
		"images": [
			{
				"top": 40,
				"left": 60,
				"width": 80,
				"height": 40,
				"pixelMapperLogo": true,
				"imageURL": "http://pixelmap.amcharts.com/static/img/logo.svg",
				"url": "http://www.amcharts.com"
			},
			{
				"title": "Ann Arbor",
				"selectable": true,
				"longitude": -83.9808,
				"latitude": 42.7908,
				"svgPath": svgpath,
				"color": "rgba(255,245,0,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(1, 4)"
			},
			{
				"title": "Athens",
				"selectable": true,
				"longitude": 23.7275,
				"latitude": 37.9838,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(2, 4)"
			},
			{
				"title": "Bangkok",
				"selectable": true,
				"longitude": 100.5018,
				"latitude": 13.7563,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(3, 4)"
			},
			{
				"title": "Colorado Springs",
				"selectable": true,
				"longitude": -104.8214,
				"latitude": 38.8339,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(4, 4)"
			},
			{
				"title": "Houston",
				"selectable": true,
				"longitude": -95.3698,
				"latitude": 29.7604,
				"svgPath": svgpath,
				"color": "rgba(255,245,0,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(5, 4)"
			},
			{
				"title": "Santorini",
				"selectable": true,
				"longitude": 25.4615,
				"latitude": 36.3932,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(6, 4)"
			},
			{
				"title": "Shanghai",
				"selectable": true,
				"longitude": 121.4737,
				"latitude": 31.2304,
				"svgPath": svgpath,
				"color": "rgba(255,30,0,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(7, 4)"
			},
			{
				"title": "Siem Reap",
				"selectable": true,
				"longitude": 103.8448,
				"latitude": 13.3671,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(8, 4)"
			},
			{
				"title": "Singapore",
				"selectable": true,
				"longitude": 103.8198,
				"latitude": 1.3521,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(9, 4)"
			},
			{
				"title": "Vancouver",
				"selectable": true,
				"longitude": -123.1207,
				"latitude": 49.2827,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(10, 4)"
			},
			{
				"title": "Vantican City",
				"selectable": true,
				"longitude": 12.4534,
				"latitude": 41.9029,
				"svgPath": svgpath,
				"color": "rgba(75,216,181,0.8)",
				"scale": 1,
				"url": "javascript:currentSlide(11, 4)"
			}
		],
		"areas": [
			/*{
				"id": "CA",
				"title": "Canada",
				"color": "rgba(125,216,125,0.8)"
			}*/
		]
	},
	"balloon": {
		"horizontalPadding": 15,
		"borderAlpha": 0,
		"borderThickness": 1,
		"verticalPadding": 15
	},
	"areasSettings": {
		"color": "rgba(182,182,182,1)",
		"outlineColor": "rgba(150,150,150,1)",
		"rollOverOutlineColor": "rgba(255,80,0,1)",
		"rollOverBrightness": 20,
		"selectedBrightness": 20,
		"selectable": true,
		"unlistedAreasAlpha": 0,
		"unlistedAreasOutlineAlpha": 0
	},
	"imagesSettings": {
		"alpha": 1,
		"color": "rgba(129,129,129,1)",
		"outlineAlpha": 0,
		"rollOverOutlineAlpha": 0,
		"outlineColor": "rgba(80,80,80,1)",
		"rollOverBrightness": 20,
		"selectedBrightness": 20,
		"selectable": true
	},
	"linesSettings": {
		"color": "rgba(129,129,129,1)",
		"selectable": true,
		"rollOverBrightness": 20,
		"selectedBrightness": 20
	},
	"zoomControl": {
		"zoomControlEnabled": true,
		"homeButtonEnabled": false,
		"panControlEnabled": false,
		"right": 38,
		"bottom": 30,
		"minZoomLevel": 1,
		"gridHeight": 100,
		"gridAlpha": 0.1,
		"gridBackgroundAlpha": 0,
		"gridColor": "#FFFFFF",
		"draggerAlpha": 1,
		"buttonCornerRadius": 2
	}
});