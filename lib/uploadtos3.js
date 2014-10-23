var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var forEachAsync = require('./foreachasync');

var UploadToS3 = function(config) {
	this.config = config;
	this.s3 = new AWS.S3(config);
}

util.inherits(UploadToS3, EventEmitter);

UploadToS3.prototype.guessType = function(filePath) {
	var ext = path.extname(filePath);
	switch (ext) {
		case '.html':
		case '.htm':
			return 'text/html'
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg'
		case '.gif':
			return 'image/gif'
		case '.png':
			return 'image/png'
		case '.ico':
			return 'image/x-icon'
		case '.js':
			return 'application/javascript'
		case '.txt':
			return 'text/plain'
	}
	return 'application/octet-stream'
};

UploadToS3.prototype.uploadFile = function(filePath, done) {
	var that = this;

	that.emit('upload', filePath);

	var sourceFilePath = path.resolve(that.config.directory, filePath)

	fs.stat(sourceFilePath, function(err, stat) {
		if (err) return done(err);

		fs.readFile(sourceFilePath, function(err, bodyBuffer) {

			if(err) return done(err);

			var params = {
				Bucket: that.config.bucket,
				Key: filePath,
				ACL: that.config.ACL || "public-read",
				Body: bodyBuffer,
				ContentLength: stat.size,
				ContentType: that.guessType(filePath),
			};

			var req = that.s3.putObject(params);
			req.send(done);

		});
	});

	return this;
};

UploadToS3.prototype.removeFile = function(filePath, done) {
	var that = this;

	that.emit('remove', filePath);

	var params = {
		Bucket: that.config.bucket,
		Key: filePath,
	};

	that.s3.deleteObject(params, done);

	return this;
}

UploadToS3.prototype.getBucketFiles = function(done) {
	var that = this;

	var files = {};

	var getPartialList = function(startFromKey) {
		var params = {
			Bucket: that.config.bucket,
			Marker: startFromKey
		};

		that.s3.listObjects(params, function(err, data) {
			if (err) return done(err);

			data.Contents.forEach(function(item) {
				files[item.Key] = {
					modified: item.LastModified,
					size: item.Size
				};
			});

			if (data.IsTruncated && data.NextMarker) {
				return getPartialList(data.NextMarker);
			}

			that.emit('bucket', files);

			done(null, files);
		});
	}

	getPartialList();

	return this;
}

UploadToS3.prototype.getDirFiles = function(done, dirPath, files) {
	var that = this;

	if (!dirPath) dirPath = '';
	if (!files) files = {};

	var sourcePath = path.resolve(that.config.directory, dirPath)
	var dirFiles = [];

	fs.readdir(sourcePath, function(err, dirFiles) {
		if (err) {
			return done(err);
		}

		forEachAsync(dirFiles, function(file, i, next) {

			if (file.substr(0, 1) === '.') return next();

			var filePath = path.join(dirPath, file);
			var sourceFilePath = path.resolve(that.config.directory, filePath);

			fs.stat(sourceFilePath, function(err, stat) {
				if (err) return done(err);

				if (stat.isDirectory()) {
					return that.getDirFiles(next, filePath, files);
				}

				if (!stat.isFile()) return next();

				files[filePath] = {
					modified: stat.mtime,
					size: stat.size
				};

				return next();
			});
		}, function(err) {
			that.emit('directory', files);

			done(err, files);
		});

	});

	return this;
};

UploadToS3.prototype.diffDir = function(done) {
	var that = this;

	that.getDirFiles(function(err, dirFiles) {
		if (err) return done(err);

		that.getBucketFiles(function(err, bucketFiles) {
			if (err) return done(err);

			var files = {};
			var filename;

			// check for files to upload for the first time or to update
			for (filename in dirFiles) {
				var dirFile = dirFiles[filename];
				var bucketFile = bucketFiles[filename];
				if (!bucketFile) {
					files[filename] = 'U';
				} else if (dirFile.size !== bucketFile.size) {
					files[filename] = 'U';
				} else if (dirFile.modified > bucketFile.modified) {
					files[filename] = 'U';
				}
			}

			// check for files to delete
			for (filename in bucketFiles) {
				if (!dirFiles[filename]) files[filename] = 'D';
			}

			that.emit('diff', files);

			done(null, files);

		});
	});

	return this;
};

UploadToS3.prototype.syncDir = function(done) {
	var that = this;

	that.diffDir(function(err, files) {
		if (err) return done(err);

		forEachAsync(files, function(status, filePath, next) {

			if (status === 'D') {
				return that.removeFile(filePath, next);
			}

			return that.uploadFile(filePath, next);
		}, done);

	});

	return this;
};


module.exports = UploadToS3;