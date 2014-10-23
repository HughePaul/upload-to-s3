upload-to-s3
============

```

# CLI
Install nodejs
Clone out the upload-to-s3 Repo
Install required modules:
```
npm install
```
Create a config file in JSON format:
```
{
	"directory": "/path/to/directory",
	"bucket": "bucketname",
	"accessKeyId": "AWSAccessKey",
	"secretAccessKey": "AWSAccessSecret",
	"region": "eu-west-1",
	"ACL": "public-read"
}
```
Run the sync script:
```
./upload-to-s3 config.json
```

# AWS Permissions
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::bucketname",
        "arn:aws:s3:::bucketname/*"
      ]
    }
  ]
}

# Initialisation
```javascript
var config = {
	"directory": "/path/to/directory",
	"bucket": "bucketname",
	"accessKeyId": "AWSAccessKey",
	"secretAccessKey": "AWSAccessSecret",
	"region": "eu-west-1"
};

var uploadToS3 = new UploadToS3(config);
```

# Events

```javascript
uploadToS3.on('directory', function(files) {
	console.log('Directory:', Object.keys(files).length, 'files');
});

uploadToS3.on('bucket', function(files) {
	console.log('Bucket:', Object.keys(files).length, 'files');
});

uploadToS3.on('diff', function(files) {
	console.log('Differences:', Object.keys(files).length, 'files');
});

uploadToS3.on('remove', function(filePath) {
	console.log('Removing S3 file', filePath);
});

uploadToS3.on('upload', function(filePath) {
	console.log('Uploading S3 file', filePath);
});
```

# Methods

```javascript
uploadToS3.diffDir(function(err, files) {
	if (err) return console.error('Error:', err);
	console.log(files);
});

uploadToS3.getBucketFiles(function(err, files) {
	if (err) return console.error('Error:', err);
	console.log(files);
});

uploadToS3.getDirFiles(function(err, files) {
	if (err) return console.error('Error:', err);
	console.log(files);
});

uploadToS3.syncDir(function(err) {
	if (err) return console.error('Error:', err);
});

```

# Example

```javascript
var config = {
	directory: "/path/to/directory",
	bucket: "bucket-name",
	accessKeyId: "AWSAccessKey",
	secretAccessKey: "AWSAccessSecret",
	region: "eu-west-1"
};

new UploadToS3(config)
	.on('remove', function(filePath) {
		console.log('Removing S3 file', filePath);
	})
	.on('upload', function(filePath) {
		console.log('Uploading S3 file', filePath);
	})
	.syncDir(function(err) {
		if (err) return console.error('Error:', err);
	});
```

