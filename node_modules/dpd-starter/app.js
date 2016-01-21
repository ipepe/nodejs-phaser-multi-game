//Author: Patryk "ipepe" Ptasiński npm@ipepe.pl, credit to: schettino72
module.exports = (function(){
	var starter_instance = {
		config: {
			host: 'localhost',
			port: 3000,
			env: 'development',
			db: {
				host: 'localhost',
				port: 27017,
				name: 'deployd',
				credentials: {
					username: 'deployd',
					password: 'deployd'
				}
			}
		},
		cloud_definitions: {},
		isCloudDefValid:function(cloud_definition){
			if(typeof cloud_definition !== 'object'){
				console.error('Invalid cloud definition', cloud_definition, 'should be object');
				return false;
			}
			if(typeof cloud_definition.name !== 'string'){
				console.error('Invalid cloud definition', cloud_definition, 'name should be string');
				return false;
			}
			if(typeof cloud_definition.default_config !== 'object'){
				console.error('Invalid cloud definition', cloud_definition, 'default_config should be object');
				return false;
			}
			if(typeof cloud_definition.isDetected !== 'function'){
				console.error('Invalid cloud definition', cloud_definition, 'isDetected should be function');
				return false;
			}
			if(typeof cloud_definition.isDetected() !== 'boolean'){
				console.error('Invalid cloud definition', cloud_definition, 'isDetected() should return boolean');
				return false;
			}
			return true;
		},
		importCloudDefinitions: function(directory){
			var fs = require('fs');
			var clouds_array = fs.readdirSync(directory);
			for(var i=0; i<clouds_array.length; i++){
				var cloud_file_name = clouds_array[i];
				var cloud_def = require(directory+'/'+cloud_file_name);
				if(starter_instance.isCloudDefValid(cloud_def)){
					starter_instance.cloud_definitions[cloud_def.name.toLowerCase()] = cloud_def;
				}
			}
			return starter_instance;
		},
		setConfig: function(options){
			if(typeof options == "object"){
				starter_instance.config.host = options.host || starter_instance.config.host;
				starter_instance.config.port = options.port || starter_instance.config.port;
				starter_instance.config.env = options.env || starter_instance.config.env;
				if(typeof options.db == "object"){
					starter_instance.config.db.host = options.db.host || starter_instance.config.db.host;
					starter_instance.config.db.port = options.db.port || starter_instance.config.db.port;
					starter_instance.config.db.name = options.db.name || starter_instance.config.db.name;
					if(typeof options.db.credentials == "object"){
						starter_instance.config.db.credentials.username = options.db.credentials.username || starter_instance.config.db.credentials.username;
						starter_instance.config.db.credentials.password = options.db.credentials.password || starter_instance.config.db.credentials.password;
					}
				}
				if(typeof options.db_connection_url == "string"){
					starter_instance.setDbConfigFromUrl(options.db_connection_url);
				}
			}
			return starter_instance;
		},
		getUrlInstance: function(){
			if(starter_instance.url_instance){
				return starter_instance.url_instance;
			}else{
				starter_instance.url_instance = require('url');
				return starter_instance.url_instance;
			}
		},
		setDbConfigFromUrl: function(connection_string){
			var url = starter_instance.getUrlInstance();
			var parsed_url = url.parse(connection_string);

			var newDbConfig = {
				db: {
					host: parsed_url.hostname,
					port: parseInt(parsed_url.port),
					name: parsed_url.pathname.slice(1),
					credentials: {
						username: parsed_url.auth.split(':')[0],
						password: parsed_url.auth.split(':')[1]
					}
				}
			};
			starter_instance.setConfig(newDbConfig);
		},
		setCloudTo: function(cloud_name, cloud_options){
			if(typeof cloud_name !== 'string'){
				console.error('Cloud name parameter is type of', typeof cloud_name, 'but should be string');
				return starter_instance;
			}
			cloud_name = cloud_name.toLowerCase();
			var cloud_def = starter_instance.cloud_definitions[cloud_name];
			if(typeof cloud_def === 'object'){
				if(cloud_def.isDetected()){
					console.log('Cloud',cloud_def.name,'found setting up config...');
					return starter_instance.setConfig(cloud_def.default_config).setConfig(cloud_options);
				}
			}else{
				console.error('Cloud', cloud_name, 'was not found');
			}
			return starter_instance;
		},
		detectCloudName: function(){
			Object.keys(starter_instance.cloud_definitions).forEach(function(cloud_def_name){
				if(starter_instance.cloud_definitions[cloud_def_name].isDetected()){
					return cloud_def_name;
				}
			});
			return 'unknown';
		},
		setCloudToAuto: function(cloud_options){
			// TODO - czy nie dałoby rady lepiej wywolac ten detectCloud?
			return starter_instance.setCloudTo( starter_instance.detectCloudName(), cloud_options);

		},
		startServer: function(after_start_callback){
			console.log('Starting server with config', starter_instance.config);
			var server = require('deployd')(starter_instance.config);
			server.listen();
			server.on('listening', function() {
				console.log('Server started listening',(new Date()).toUTCString(),'at', server.options.host, server.options.port);
				if ( typeof after_start_callback === "function" ) after_start_callback();
			});
			server.on('error', function(err) {
				console.error( err );
				console.log('Error!', err);
				// Give the server a chance to return an error
				process.nextTick(function() {
					process.exit();
				});
			});
			return server;
		}

	};
	return starter_instance.importCloudDefinitions(__dirname + '/clouds');
})();
