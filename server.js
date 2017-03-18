/*http server create*/
var express=require('express'),
	app=express();
/*mqtt client create*/
var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://test.mosquitto.org')
var port = process.env.PORT || 3000;
/*postgresql client create*/
var pg = require('pg');
/*get datas*/
var data = {homerseklet:0,nedvesseg:0};
var fs= require('fs');
var sprintf = require('sprintf').sprintf;
var connectionString = process.env.DATABASE_URL ||"postgres://kldpiqgdkrqypo:be78f021efa0263dd415150760e9d4ea324731c30fde1ff34204c9bb047878cd@ec2-23-21-213-202.compute-1.amazonaws.com:5432/ddvt14rq2g8n3p";
pg.defaults.ssl = true;
/*strart the main frontend*/
app.get("/", function(request,response){
	response.sendfile("index.html");
});
app.use(express.static("Pictures"));
/*Node server is listen*/
var server = app.listen(port, function () {
    console.log('node server is just fine! and running on port - ' + port);
});
var io=require('socket.io').listen(server);
/*subscribe to topics*/
client.on('connect', function () {
  client.subscribe('adatok');
})
app.get("/adatok",function(req,res){
	pg.connect(connectionString, function(err, client) {
		if (err) throw err;
			console.log('Connected to postgres!');
		var query="select * from hello";
		client.query(query, function(err, result) {
			if(err) {
				return console.error('error running query', err);
			}
			else{
				var data=[];
				for(var i=0; i<result.rows.length; ++i){
					data[i]={"Temperature" : result.rows[i].Temp, "Humidity": result.rows[i].nedvesseg, "time_1": result.rows[i].time_1,"time_2": result.rows[i].time_2};
					console.log(data[i]);
				}
				res.send(data);
				client.end();
			}
		});
	});
});
/*receave message from topics*/
client.on('message', function (topic, message) {
	var h=JSON.parse(message.toString());
	var date = new Date();
	var hours = date.getHours();
	var month = date.getUTCMonth() + 1; //months from 1-12
	var day = date.getUTCDate();
	var year = date.getUTCFullYear();
	var minutes = date.getMinutes();
	var data={"Temperature": h.homerseklet,
	"Humidity": h.nedvesseg,
	"time_1": year+"-"+month+"-"+day,
	"time_2": hours+":"+minutes
	};
	pg.connect(connectionString, function(err, client) {
	if (err) throw err;
		console.log('Connected to postgres!');
		var query=sprintf('insert into hello("Temp",nedvesseg,time_1,time_2) values(%s,%s,\'%d-%d-%d\',\'%d:%d\')',h.homerseklet,h.nedvesseg,year,month,day,hours,minutes);
		client.query(query, function(err, result) {
			if(err) {
				return console.error('error running query', err);
			}
			client.end();
		});
	});
	io.emit("adat",data);
});
io.on('connection', function(socket){
		console.log("connected");
	});