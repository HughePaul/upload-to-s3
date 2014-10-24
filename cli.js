var UploadToS3 = require('./lib/uploadtos3');

var fs = require('fs');
var path = require('path');

var config;

// load in config from command line specified json file
var configFile = process.argv[2]
try {
	var configData = fs.readFileSync(configFile);
	config = JSON.parse(configData);
} catch (e) {
	console.error(e.message);
	console.error(
		'Usage: ./uploadtos3 config.json\n' +
		'Config File should contain:\n' +
		'{\n' +
		'  "directory": "/path/to/directory",\n' +
		'  "bucket": "bucket-name",\n' +
		'  "accessKeyId": "AWSAccessKey",\n' +
		'  "secretAccessKey": "AWSAccessSecret",\n' +
		'  "region": "eu-west-1"\n' +
		'}'
	);
	process.exit(-1);
}

config.directory = path.resolve(path.dirname(configFile), config.directory);

new UploadToS3(config)

.on('directory', function(files) {
	console.log('Directory:', Object.keys(files).length, 'files');
})

.on('bucket', function(files) {
	console.log('Bucket:', Object.keys(files).length, 'files');
})

.on('diff', function(files) {
	console.log('Differences:', Object.keys(files).length, 'files');
})

.on('remove', function(filePath) {
	console.log('Removing S3 file', filePath);
})

.on('upload', function(filePath, contentType, size) {
	console.log('Uploading S3 file', filePath, contentType, Math.round(size/1024)+'kb');
})

.syncDir(function(err) {
	if (err) return console.error('Error:', err);
});



