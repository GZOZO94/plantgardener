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
/*subscribe to topics*/
client.on('connect', function () {
  client.subscribe('adatok');
})
/*receave message from topics*/
client.on('message', function (topic, message) {
	var h=JSON.parse(message.toString());
	console.log(h.homerseklet);
	pg.connect(connectionString, function(err, client) {
	if (err) throw err;
		console.log('Connected to postgres!');
		var query=sprintf('insert into hello("Temp",nedvesseg) values(%s,%s)',h.homerseklet,h.nedvesseg)
			client.query(query, function(err, result) {
			if(err) {
				return console.error('error running query', err);
			}
			client.end();
		});
	});
})

