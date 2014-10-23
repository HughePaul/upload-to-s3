var forEachAsync = function(array, cb, done) {
	var next;
	if (Array.isArray(array)) {

		var index = -1;

		next = function(err) {
			if (err) return done && done(err);

			index++;

			if (index >= array.length) return done && done();

			cb(array[index], index, next);
		}

	} else {

		var keys = Object.keys(array);

		next = function(err) {
			if (err) return done && done(err);

			var key = keys.shift();

			if (key === undefined) return done && done();

			cb(array[key], key, next);
		}

	}

	return next();
};

module.exports = forEachAsync;