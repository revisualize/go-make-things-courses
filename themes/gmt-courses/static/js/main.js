/*!
 * gmt-courses v1.7.0: The theme for courses.gomakethings.com
 * (c) 2018 Chris Ferdinandi
 * MIT License
 * http://github.com/cferdinandi/go-make-things-courses
 * Open Source Credits: https://github.com/toddmotto/fluidvids, http://prismjs.com, https://github.com/filamentgroup/loadJS/, https://github.com/filamentgroup/loadCSS, https://github.com/bramstein/fontfaceobserver
 */

/**
 * NodeList.prototype.forEach() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
 */
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function (callback, thisArg) {
		thisArg = thisArg || window;
		for (var i = 0; i < this.length; i++) {
			callback.call(thisArg, this[i], i, this);
		}
	};
}
/**
 * Run the web app
 */
var app = function () {

	'use strict';

	//
	// Variables
	//

	var baseURL = 'https://courses.gomakethings.com';


	//
	// Methods
	//

	/**
	 * Get the URL parameters
	 * source: https://css-tricks.com/snippets/javascript/get-url-variables/
	 * @param  {String} url The URL
	 * @return {Object}     The URL parameters
	 */
	var getParams = function (url) {
		var params = {};
		var parser = document.createElement('a');
		parser.href = url;
		var query = parser.search.substring(1);
		var vars = query.split('&');
		for (var i=0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			params[pair[0]] = decodeURIComponent(pair[1]);
		}
		return params;
	};

	var decodeHTML = function (html) {
		var txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	};

	var setData = function (data) {
		sessionStorage.setItem('gmtCoursesLoggedIn', JSON.stringify(data));
	};

	var getData = function () {
		var data = sessionStorage.getItem('gmtCoursesLoggedIn');
		if (!data) return;
		return JSON.parse(data);
	};

	var getResources = function () {
		var data = getData();
		if (!data) return;
		return data.data.resources;
	};

	var getCourses = function () {
		var data = getData();
		if (!data) return;
		return data.data.courses;
	};

	var getCourse = function (id) {
		var data = getData();
		id = parseInt(id, 10);
		if (!data) return;
		return data.data.courses.find((function (course) {
			return parseInt(course.id, 10) === id;
		}));
	};

	var getLesson = function (courseID, lessonID) {
		var course = getCourse(courseID);
		if (!course) return;
		return course.lessons.find((function (lesson) {
			return lesson.id === lessonID;
		}));
	};

	var getAjax = function (data, callback) {
		atomic.ajax({
			type: 'POST',
			url: baseURL + '/manage-account/wp-admin/admin-ajax.php',
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			data: data
		}).success((function (data) {
			callback(data);
		}));
	};

	var renderNoAccess = function (content) {
		content.innerHTML = '<p>You do not have access to this content. Sorry!</p>';
	};

	var renderDashboard = function (content) {
		var courses = getCourses();
		if (!courses) {
			content.innerHTML = '<ul><li>You don\'t have any courses yet.</li></ul>';
			return;
		}
		var courseList = '';
		courses.forEach((function (course) {
			courseList += '<li id="' + course.id + '"><a href="' + course.url + '">' + course.title + '</a></li>';
		}));
		content.innerHTML = '<ul>' + courseList + '</ul>';
	};

	var renderLesson = function (content) {
		var lesson = getLesson(content.getAttribute('data-course'), content.getAttribute('data-lesson'));
		if (!lesson) {
			renderNoAccess(content);
			return;
		}
		var next = content.getAttribute('data-lesson-next');
		var prev = content.getAttribute('data-lesson-prev');
		content.innerHTML =
			'<div class="margin-bottom">' +
				'<iframe src="https://player.vimeo.com/video/' + lesson.video + '?title=0&byline=0&portrait=0" width="640" height="388" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>' +
			'</div>' +
			'<div class="clearfix margin-bottom">' +
				( next ? '<a class="btn float-right" href="' + next + '">Next Lesson &rarr;</a>' : '' ) +
				( prev ? '<a href="' + prev + '">&larr; Previous Lesson</a>' : '' ) +
			'</div>' +
			decodeHTML(lesson.content);
		fluidvids.render();
	};

	var renderResources = function (content) {
		var resources = getResources();
		var resourceList = '';
		if (!resources) {
			content.innerHTML = '';
			return;
		}
		resources.forEach((function (resource) {
			resourceList += '<li><a href="' + resource.url + '">' + resource.title + '</a></li>';
		}));
		content.innerHTML = '<ul>' + resourceList + '</ul>';
	};

	var renderPasswordReset = function (content) {

		// Variables
		var params = getParams(window.location.href);
		var lost = content.querySelector('#lost-password');
		var reset = content.querySelector('#reset-password');
		var placeholder = content.querySelector('#password-reset-placeholder');
		if (!lost || !reset || !placeholder) return;

		// If this is a reset link, validate the reset key
		if (params.email && params.key) {
			getAjax({
				action: 'is_reset_key_valid',
				username: params.email,
				key: params.key
			}, (function (data) {

				// Hide the placeholder
				placeholder.setAttribute('hidden', 'hidden');

				// If the reset key is valid, show the reset form
				if (data.code === 200) {
					reset.removeAttribute('hidden');
				}

				// Otherwise, show the request a reset form with an error
				else {
					lost.removeAttribute('hidden');
					throwFormError(data.message);
				}

			}));
			return;
		}

		// Otherwise, show "request a reset"
		placeholder.setAttribute('hidden', 'hidden');
		lost.removeAttribute('hidden');

	};

	var render = function () {

		// Variables
		var content = document.querySelector('[data-app]');
		if (!content) return;
		var type = content.getAttribute('data-app');

		// Render
		if (type === 'lesson') {
			renderLesson(content);
		} else if (type === 'dashboard') {
			renderDashboard(content);
		} else if (type === 'resources') {
			renderResources(content);
		} else if (type === 'reset-password') {
			renderPasswordReset(content);
		}

		// Rehighlight code
		Prism.highlightAll();

	};

	var fetchCourses = function () {
		getAjax({action: 'gmt_courses_get_courses'}, (function (data) {
			if (data.code === 200) {
				setData(data.data);
				render();
			} else {
				console.log('fetchCourses failed: ' + data.message);
			}
		}));
	};

	var disableButton = function () {
		var btns = document.querySelectorAll('[data-submit]');
		btns.forEach((function (btn) {
			var processing = btn.getAttribute('data-processing');
			if (processing) {
				btn.setAttribute('data-original', btn.innerHTML);
				btn.innerHTML = processing;
			}
			btn.setAttribute('disabled', 'disabled');
		}));
	};

	var enableButton = function () {
		var btns = document.querySelectorAll('[data-submit]');
		btns.forEach((function (btn) {
			var original = btn.getAttribute('data-original');
			if (original) {
				btn.innerHTML = original;
			}
			btn.removeAttribute('disabled');
		}));
	};

	var throwFormError = function (msg, success) {
		var errors = document.querySelectorAll('[data-form-error]');
		errors.forEach((function (error) {
			error.innerHTML = msg;
			error.className = success ? 'success-message' : 'error-message';
		}));
	};

	var clearFormError = function () {
		var errors = document.querySelectorAll('[data-form-error]');
		errors.forEach((function (error) {
			error.innerHTML = '';
			error.className = '';
		}));
	};

	var processLogin = function (form) {
		var email = form.querySelector('#email');
		var pw = form.querySelector('#password');
		var error = document.querySelector('#form-error');
		if (!email || !pw || email.value.length < 1 || pw.value.length < 1) {
			throwFormError('Please fill in all fields.');
			return;
		}
		disableButton();
		clearFormError();
		getAjax({
			action: 'gmt_courses_login',
			username: email.value,
			password: pw.value
		}, (function (data) {
			enableButton();
			if (data.code === 200) {
				document.documentElement.className += ' logged-in';
				fetchCourses();
			} else {
				throwFormError(data.message);
			}
		}));
	};

	var processJoin = function (form) {
		var email = form.querySelector('#email');
		var pw = form.querySelector('#password');
		var error = document.querySelector('#form-error');
		if (!email || !pw || email.value.length < 1 || pw.value.length < 1) {
			throwFormError('Please fill in all fields.');
			return;
		}
		disableButton();
		clearFormError();
		getAjax({
			action: 'gmt_courses_create_user',
			username: email.value,
			password: pw.value
		}, (function (data) {
			enableButton();
			if (data.code === 200) {
				form.parentNode.innerHTML = '<p>' + data.message + '</p>';
			} else {
				throwFormError(data.message);
			}
		}));
	};

	var processChangePW = function (form) {
		var currentPW = form.querySelector('#current-password');
		var newPW = form.querySelector('#new-password');
		var error = document.querySelector('#form-error');
		if (!currentPW || !newPW || currentPW.value.length < 1 || newPW.value.length < 1) {
			throwFormError('Please fill in all fields.');
			return;
		}
		disableButton();
		clearFormError();
		getAjax({
			action: 'gmt_courses_change_password',
			current_password: currentPW.value,
			new_password: newPW.value
		}, (function (data) {
			enableButton();
			if (data.code === 200) {
				throwFormError(data.message, true);
				currentPW.value = '';
				newPW.value = '';
			} else {
				throwFormError(data.message);
			}
		}));
	};

	var validate = function () {
		if (!document.querySelector('#validate-user')) return;
		var params = getParams(window.location.href);
		if (!params.email || !params.key) return;
		getAjax({
			action: 'gmt_courses_validate_new_account',
			username: params.email,
			key: params.key
		}, (function (data) {
			var success = data.code === 200 ? true : false;
			throwFormError(data.message, success);
		}));
	};

	var logoutHandler = function (event) {
		if (!event.target.matches('#logout')) return;
		event.preventDefault();
		event.target.parentNode.innerHTML = '<span class="text-muted">Logging out...</span>';
		getAjax({action: 'gmt_courses_logout'}, (function (data) {
			sessionStorage.removeItem('gmtCoursesLoggedIn');
			window.location.reload();
		}));
	};

	var formHandler = function (event) {
		if (event.target.matches('#login-form')) {
			event.preventDefault();
			processLogin(event.target);
		}

		else if (event.target.matches('#join-form')) {
			event.preventDefault();
			processJoin(event.target);
		}

		else if (event.target.matches('#change-password-form')) {
			event.preventDefault();
			processChangePW(event.target);
		}
	};

	var loadApp = function () {
		var data = getData();
		if (data) {
			if (data.data) {
				render();
			} else {
				fetchCourses();
			}
		} else {
			getAjax({action: 'gmt_courses_is_logged_in'}, (function (data) {
				if (data.code === 200) {
					document.documentElement.className += ' logged-in';
					fetchCourses();
				}
			}));
		}
	};


	//
	// Event Listeners & Inits
	//

	document.addEventListener('submit', formHandler, false);
	document.addEventListener('click', logoutHandler, false);
	validate();
	loadApp();

};
/*!
 * atomicjs v3.4.0: A tiny vanilla JS Ajax/HTTP plugin with great browser support
 * (c) 2017 Chris Ferdinandi
 * MIT License
 * https://github.com/cferdinandi/atomic
 * Originally created and maintained by Todd Motto - https://toddmotto.com
 */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], (function () {
			return factory(root);
		}));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		window.atomic = factory(root);
	}
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, (function (window) {

	'use strict';

	//
	// Variables
	//

	var atomic = {}; // Object for public APIs
	var supports = !!window.XMLHttpRequest && !!window.JSON; // Feature test
	var settings;

	// Default settings
	var defaults = {
		type: 'GET',
		url: null,
		data: {},
		callback: null,
		headers: {
			'Content-type': 'application/x-www-form-urlencoded'
		},
		responseType: 'text',
		withCredentials: false
	};


	//
	// Methods
	//

	/**
	 * Merge two or more objects. Returns a new object.
	 * @private
	 * @param {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
	 * @param {Object}   objects  The objects to merge together
	 * @returns {Object}          Merged values of defaults and options
	 */
	var extend = function () {

		// Setup extended object
		var extended = {};

		// Merge the object into the extended object
		var merge = function (obj) {
			for ( var prop in obj ) {
				if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
					if ( Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
						extended[prop] = extend( true, extended[prop], obj[prop] );
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};

		// Loop through each object and conduct a merge
		for (var i = 0; i < arguments.length; i++) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;

	};

	/**
	 * Parse text response into JSON
	 * @private
	 * @param  {String} req The response
	 * @return {Array}      A JSON Object of the responseText, plus the orginal response
	 */
	var parse = function (req) {
		var result;
		if (settings.responseType !== 'text' && settings.responseType !== '') {
			return [req.response, req];
		}
		try {
			result = JSON.parse(req.responseText);
		} catch (e) {
			result = req.responseText;
		}
		return [result, req];
	};

	/**
	 * Convert an object into a query string
	 * @private
	 * @@link  https://blog.garstasio.com/you-dont-need-jquery/ajax/
	 * @param  {Object|Array|String} obj The object
	 * @return {String}                  The query string
	 */
	var param = function (obj) {
		if (typeof (obj) === 'string') return obj;
		if (/application\/json/i.test(settings.headers['Content-type']) || Object.prototype.toString.call(obj) === '[object Array]') return JSON.stringify(obj);
		var encoded = [];
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				encoded.push(encodeURIComponent(prop) + '=' + encodeURIComponent(obj[prop]));
			}
		}
		return encoded.join('&');
	};

	/**
	 * Make an XML HTTP request
	 * @private
	 * @return {Object} Chained success/error/always methods
	 */
	var xhr = function () {

		// Our default methods
		var methods = {
			success: function () {},
			error: function () {},
			always: function () {}
		};

		// Create our HTTP request
		var request = new XMLHttpRequest();

		// Override defaults with user methods and setup chaining
		var atomXHR = {
			success: function (callback) {
				methods.success = callback;
				return atomXHR;
			},
			error: function (callback) {
				methods.error = callback;
				return atomXHR;
			},
			always: function (callback) {
				methods.always = callback;
				return atomXHR;
			},
			abort: function () {
				request.abort();
			},
			request: request
		};

		// Setup our listener to process compeleted requests
		request.onreadystatechange = function () {

			// Only run if the request is complete
			if ( request.readyState !== 4 ) return;

			// Parse the response text
			var req = parse(request);

			// Process the response
			if (request.status >= 200 && request.status < 300) {
				// If successful
				methods.success.apply(methods, req);
			} else {
				// If failed
				methods.error.apply(methods, req);
			}

			// Run always
			methods.always.apply(methods, req);

		};

		// Setup our HTTP request
		request.open(settings.type, settings.url, true);
		request.responseType = settings.responseType;

		// Add headers
		for (var header in settings.headers) {
			if (settings.headers.hasOwnProperty(header)) {
				request.setRequestHeader(header, settings.headers[header]);
			}
		}

		// Add withCredentials
		if (settings.withCredentials) {
			request.withCredentials = true;
		}

		// Send the request
		request.send(param(settings.data));

		return atomXHR;
	};

	/**
	 * Make a JSONP request
	 * @private
	 * @return {[type]} [description]
	 */
	var jsonp = function () {
		// Create script with the url and callback
		var ref = window.document.getElementsByTagName( 'script' )[ 0 ];
		var script = window.document.createElement( 'script' );
		settings.data.callback = settings.callback;
		script.src = settings.url + (settings.url.indexOf( '?' ) + 1 ? '&' : '?') + param(settings.data);

		// Insert script tag into the DOM (append to <head>)
		ref.parentNode.insertBefore( script, ref );

		// After the script is loaded and executed, remove it
		script.onload = function () {
			this.remove();
		};
	};

	/**
	 * Make an Ajax request
	 * @public
	 * @param  {Object} options  User settings
	 * @return {String|Object}   The Ajax request response
	 */
	atomic.ajax = function (options) {

		// feature test
		if ( !supports ) return;

		// Merge user options with defaults
		settings = extend( defaults, options || {} );

		// Make our Ajax or JSONP request
		return ( settings.type.toLowerCase() === 'jsonp' ? jsonp() : xhr() );

	};


	//
	// Public APIs
	//

	return atomic;

}));
/*! fluidvids.js v2.4.1 | (c) 2014 @toddmotto | https://github.com/toddmotto/fluidvids */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory;
  } else {
    root.fluidvids = factory();
  }
})(this, (function () {

  'use strict';

  var fluidvids = {
    selector: ['iframe'],
    players: ['www.youtube.com', 'player.vimeo.com']
  };

  var css = [
    '.fluidvids {',
      'width: 100%; max-width: 100%; position: relative;',
    '}',
    '.fluidvids-item {',
      'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;',
    '}'
  ].join('');

  var head = document.head || document.getElementsByTagName('head')[0];

  var matches = function (src) {
    return new RegExp('^(https?:)?\/\/(?:' + fluidvids.players.join('|') + ').*$', 'i').test(src);
  };

  var getRatio = function (height, width) {
    return ((parseInt(height, 10) / parseInt(width, 10)) * 100) + '%';
  };

  var fluid = function (elem) {
    if (!matches(elem.src) || !!elem.getAttribute('data-fluidvids')) return;
    var wrap = document.createElement('div');
    elem.parentNode.insertBefore(wrap, elem);
    elem.className += (elem.className ? ' ' : '') + 'fluidvids-item';
    elem.setAttribute('data-fluidvids', 'loaded');
    wrap.className += 'fluidvids';
    wrap.style.paddingTop = getRatio(elem.height, elem.width);
    wrap.appendChild(elem);
  };

  var addStyles = function () {
    var div = document.createElement('div');
    div.innerHTML = '<p>x</p><style>' + css + '</style>';
    head.appendChild(div.childNodes[1]);
  };

  fluidvids.render = function () {
    var nodes = document.querySelectorAll(fluidvids.selector.join());
    var i = nodes.length;
    while (i--) {
      fluid(nodes[i]);
    }
  };

  fluidvids.init = function (obj) {
    for (var key in obj) {
      fluidvids[key] = obj[key];
    }
    fluidvids.render();
    addStyles();
  };

  return fluidvids;

}));
/* http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript+bash+css-extras+php+php-extras+scss */
/* jshint ignore:start */
var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
			? self // if in worker
			: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function () {

	// Private helper vars
	var lang = /\blang(?:uage)?-(\w+)\b/i;
	var uniqueId = 0;

	var _ = _self.Prism = {
		manual: _self.Prism && _self.Prism.manual,
		util: {
			encode: function (tokens) {
				if (tokens instanceof Token) {
					return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
				} else if (_.util.type(tokens) === 'Array') {
					return tokens.map(_.util.encode);
				} else {
					return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
				}
			},

			type: function (o) {
				return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
			},

			objId: function (obj) {
				if (!obj['__id']) {
					Object.defineProperty(obj, '__id', { value: ++uniqueId });
				}
				return obj['__id'];
			},

			// Deep clone a language definition (e.g. to extend it)
			clone: function (o) {
				var type = _.util.type(o);

				switch (type) {
					case 'Object':
						var clone = {};

						for (var key in o) {
							if (o.hasOwnProperty(key)) {
								clone[key] = _.util.clone(o[key]);
							}
						}

						return clone;

					case 'Array':
						// Check for existence for IE8
						return o.map && o.map((function (v) { return _.util.clone(v); }));
				}

				return o;
			}
		},

		languages: {
			extend: function (id, redef) {
				var lang = _.util.clone(_.languages[id]);

				for (var key in redef) {
					lang[key] = redef[key];
				}

				return lang;
			},

			/**
			 * Insert a token before another token in a language literal
			 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
			 * we cannot just provide an object, we need anobject and a key.
			 * @param inside The key (or language id) of the parent
			 * @param before The key to insert before. If not provided, the function appends instead.
			 * @param insert Object with the key/value pairs to insert
			 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
			 */
			insertBefore: function (inside, before, insert, root) {
				root = root || _.languages;
				var grammar = root[inside];

				if (arguments.length == 2) {
					insert = arguments[1];

					for (var newToken in insert) {
						if (insert.hasOwnProperty(newToken)) {
							grammar[newToken] = insert[newToken];
						}
					}

					return grammar;
				}

				var ret = {};

				for (var token in grammar) {

					if (grammar.hasOwnProperty(token)) {

						if (token == before) {

							for (var newToken in insert) {

								if (insert.hasOwnProperty(newToken)) {
									ret[newToken] = insert[newToken];
								}
							}
						}

						ret[token] = grammar[token];
					}
				}

				// Update references in other language definitions
				_.languages.DFS(_.languages, (function (key, value) {
					if (value === root[inside] && key != inside) {
						this[key] = ret;
					}
				}));

				return root[inside] = ret;
			},

			// Traverse a language definition with Depth First Search
			DFS: function (o, callback, type, visited) {
				visited = visited || {};
				for (var i in o) {
					if (o.hasOwnProperty(i)) {
						callback.call(o, i, o[i], type || i);

						if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
							visited[_.util.objId(o[i])] = true;
							_.languages.DFS(o[i], callback, null, visited);
						}
						else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
							visited[_.util.objId(o[i])] = true;
							_.languages.DFS(o[i], callback, i, visited);
						}
					}
				}
			}
		},
		plugins: {},

		highlightAll: function (async, callback) {
			var env = {
				callback: callback,
				selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
			};

			_.hooks.run("before-highlightall", env);

			var elements = env.elements || document.querySelectorAll(env.selector);

			for (var i = 0, element; element = elements[i++];) {
				_.highlightElement(element, async === true, env.callback);
			}
		},

		highlightElement: function (element, async, callback) {
			// Find language
			var language, grammar, parent = element;

			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}

			if (parent) {
				language = (parent.className.match(lang) || [, ''])[1].toLowerCase();
				grammar = _.languages[language];
			}

			// Set language on the element, if not present
			element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

			// Set language on the parent, for styling
			parent = element.parentNode;

			if (/pre/i.test(parent.nodeName)) {
				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			}

			var code = element.textContent;

			var env = {
				element: element,
				language: language,
				grammar: grammar,
				code: code
			};

			_.hooks.run('before-sanity-check', env);

			if (!env.code || !env.grammar) {
				if (env.code) {
					_.hooks.run('before-highlight', env);
					env.element.textContent = env.code;
					_.hooks.run('after-highlight', env);
				}
				_.hooks.run('complete', env);
				return;
			}

			_.hooks.run('before-highlight', env);

			if (async && _self.Worker) {
				var worker = new Worker(_.filename);

				worker.onmessage = function (evt) {
					env.highlightedCode = evt.data;

					_.hooks.run('before-insert', env);

					env.element.innerHTML = env.highlightedCode;

					callback && callback.call(env.element);
					_.hooks.run('after-highlight', env);
					_.hooks.run('complete', env);
				};

				worker.postMessage(JSON.stringify({
					language: env.language,
					code: env.code,
					immediateClose: true
				}));
			}
			else {
				env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(element);

				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			}
		},

		highlight: function (text, grammar, language) {
			var tokens = _.tokenize(text, grammar);
			return Token.stringify(_.util.encode(tokens), language);
		},

		matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
			var Token = _.Token;

			for (var token in grammar) {
				if (!grammar.hasOwnProperty(token) || !grammar[token]) {
					continue;
				}

				if (token == target) {
					return;
				}

				var patterns = grammar[token];
				patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

				for (var j = 0; j < patterns.length; ++j) {
					var pattern = patterns[j],
						inside = pattern.inside,
						lookbehind = !!pattern.lookbehind,
						greedy = !!pattern.greedy,
						lookbehindLength = 0,
						alias = pattern.alias;

					if (greedy && !pattern.pattern.global) {
						// Without the global flag, lastIndex won't work
						var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
						pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
					}

					pattern = pattern.pattern || pattern;

					// Don’t cache length as it changes during the loop
					for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

						var str = strarr[i];

						if (strarr.length > text.length) {
							// Something went terribly wrong, ABORT, ABORT!
							return;
						}

						if (str instanceof Token) {
							continue;
						}

						pattern.lastIndex = 0;

						var match = pattern.exec(str),
							delNum = 1;

						// Greedy patterns can override/remove up to two previously matched tokens
						if (!match && greedy && i != strarr.length - 1) {
							pattern.lastIndex = pos;
							match = pattern.exec(text);
							if (!match) {
								break;
							}

							var from = match.index + (lookbehind ? match[1].length : 0),
								to = match.index + match[0].length,
								k = i,
								p = pos;

							for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
								p += strarr[k].length;
								// Move the index i to the element in strarr that is closest to from
								if (from >= p) {
									++i;
									pos = p;
								}
							}

							/*
							 * If strarr[i] is a Token, then the match starts inside another Token, which is invalid
							 * If strarr[k - 1] is greedy we are in conflict with another greedy pattern
							 */
							if (strarr[i] instanceof Token || strarr[k - 1].greedy) {
								continue;
							}

							// Number of tokens to delete and replace with the new match
							delNum = k - i;
							str = text.slice(pos, p);
							match.index -= pos;
						}

						if (!match) {
							if (oneshot) {
								break;
							}

							continue;
						}

						if (lookbehind) {
							lookbehindLength = match[1].length;
						}

						var from = match.index + lookbehindLength,
							match = match[0].slice(lookbehindLength),
							to = from + match.length,
							before = str.slice(0, from),
							after = str.slice(to);

						var args = [i, delNum];

						if (before) {
							++i;
							pos += before.length;
							args.push(before);
						}

						var wrapped = new Token(token, inside ? _.tokenize(match, inside) : match, alias, match, greedy);

						args.push(wrapped);

						if (after) {
							args.push(after);
						}

						Array.prototype.splice.apply(strarr, args);

						if (delNum != 1)
							_.matchGrammar(text, strarr, grammar, i, pos, true, token);

						if (oneshot)
							break;
					}
				}
			}
		},

		tokenize: function (text, grammar, language) {
			var strarr = [text];

			var rest = grammar.rest;

			if (rest) {
				for (var token in rest) {
					grammar[token] = rest[token];
				}

				delete grammar.rest;
			}

			_.matchGrammar(text, strarr, grammar, 0, 0, false);

			return strarr;
		},

		hooks: {
			all: {},

			add: function (name, callback) {
				var hooks = _.hooks.all;

				hooks[name] = hooks[name] || [];

				hooks[name].push(callback);
			},

			run: function (name, env) {
				var callbacks = _.hooks.all[name];

				if (!callbacks || !callbacks.length) {
					return;
				}

				for (var i = 0, callback; callback = callbacks[i++];) {
					callback(env);
				}
			}
		}
	};

	var Token = _.Token = function (type, content, alias, matchedStr, greedy) {
		this.type = type;
		this.content = content;
		this.alias = alias;
		// Copy of the full string this token was created from
		this.length = (matchedStr || "").length | 0;
		this.greedy = !!greedy;
	};

	Token.stringify = function (o, language, parent) {
		if (typeof o == 'string') {
			return o;
		}

		if (_.util.type(o) === 'Array') {
			return o.map((function (element) {
				return Token.stringify(element, language, o);
			})).join('');
		}

		var env = {
			type: o.type,
			content: Token.stringify(o.content, language, parent),
			tag: 'span',
			classes: ['token', o.type],
			attributes: {},
			language: language,
			parent: parent
		};

		if (env.type == 'comment') {
			env.attributes['spellcheck'] = 'true';
		}

		if (o.alias) {
			var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
			Array.prototype.push.apply(env.classes, aliases);
		}

		_.hooks.run('wrap', env);

		var attributes = Object.keys(env.attributes).map((function (name) {
			return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
		})).join(' ');

		return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

	};

	if (!_self.document) {
		if (!_self.addEventListener) {
			// in Node.js
			return _self.Prism;
		}
		// In worker
		_self.addEventListener('message', (function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code,
				immediateClose = message.immediateClose;

			_self.postMessage(_.highlight(code, _.languages[lang], lang));
			if (immediateClose) {
				_self.close();
			}
		}), false);

		return _self.Prism;
	}

	//Get current script and highlight
	var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

	if (script) {
		_.filename = script.src;

		if (document.addEventListener && !_.manual && !script.hasAttribute('data-manual')) {
			if (document.readyState !== "loading") {
				if (window.requestAnimationFrame) {
					window.requestAnimationFrame(_.highlightAll);
				} else {
					window.setTimeout(_.highlightAll, 16);
				}
			}
			else {
				document.addEventListener('DOMContentLoaded', _.highlightAll);
			}
		}
	}

	return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism;
}
;
Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': /<!DOCTYPE[\s\S]+?>/i,
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\s\S])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\s\S]*?(\1)|[^\s>]+)/i,
				inside: {
					'punctuation': /[=>"']/
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', (function (env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
}));

Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.css = {
	'comment': /\/\*[\s\S]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
	'string': {
		pattern: /("|')(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'property': /(\b|\B)[\w-]+(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.util.clone(Prism.languages.css);

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism.languages.css,
			alias: 'language-css'
		}
	});

	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|').*?\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
};
Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': {
		pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b-?(0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,
	'operator': /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true,
		greedy: true
	}
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\\\|\\?[^\\])*?`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\$\{[^}]+\}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
			alias: 'language-javascript'
		}
	});
}

Prism.languages.js = Prism.languages.javascript;

(function (Prism) {
	var insideString = {
		variable: [
			// Arithmetic Environment
			{
				pattern: /\$?\(\([\s\S]+?\)\)/,
				inside: {
					// If there is a $ sign at the beginning highlight $(( and )) as variable
					variable: [{
						pattern: /(^\$\(\([\s\S]+)\)\)/,
						lookbehind: true
					},
						/^\$\(\(/,
					],
					number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee]-?\d+)?)\b/,
					// Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
					operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
					// If there is no $ sign at the beginning highlight (( and )) as punctuation
					punctuation: /\(\(?|\)\)?|,|;/
				}
			},
			// Command Substitution
			{
				pattern: /\$\([^)]+\)|`[^`]+`/,
				inside: {
					variable: /^\$\(|^`|\)$|`$/
				}
			},
			/\$(?:[a-z0-9_#\?\*!@]+|\{[^}]+\})/i
		],
	};

	Prism.languages.bash = {
		'shebang': {
			pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/,
			alias: 'important'
		},
		'comment': {
			pattern: /(^|[^"{\\])#.*/,
			lookbehind: true
		},
		'string': [
			//Support for Here-Documents https://en.wikipedia.org/wiki/Here_document
			{
				pattern: /((?:^|[^<])<<\s*)(?:"|')?(\w+?)(?:"|')?\s*\r?\n(?:[\s\S])*?\r?\n\2/g,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			{
				pattern: /(["'])(?:\\\\|\\?[^\\])*?\1/g,
				greedy: true,
				inside: insideString
			}
		],
		'variable': insideString.variable,
		// Originally based on http://ss64.com/bash/
		'function': {
			pattern: /(^|\s|;|\||&)(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|npm|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)(?=$|\s|;|\||&)/,
			lookbehind: true
		},
		'keyword': {
			pattern: /(^|\s|;|\||&)(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|\s|;|\||&)/,
			lookbehind: true
		},
		'boolean': {
			pattern: /(^|\s|;|\||&)(?:true|false)(?=$|\s|;|\||&)/,
			lookbehind: true
		},
		'operator': /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
		'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];]/
	};

	var inside = insideString.variable[1].inside;
	inside['function'] = Prism.languages.bash['function'];
	inside.keyword = Prism.languages.bash.keyword;
	inside.boolean = Prism.languages.bash.boolean;
	inside.operator = Prism.languages.bash.operator;
	inside.punctuation = Prism.languages.bash.punctuation;
})(Prism);

Prism.languages.css.selector = {
	pattern: /[^\{\}\s][^\{\}]*(?=\s*\{)/,
	inside: {
		'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
		'pseudo-class': /:[-\w]+(?:\(.*\))?/,
		'class': /\.[-:\.\w]+/,
		'id': /#[-:\.\w]+/,
		'attribute': /\[[^\]]+\]/
	}
};

Prism.languages.insertBefore('css', 'function', {
	'hexcode': /#[\da-f]{3,8}/i,
	'entity': /\\[\da-f]{1,8}/i,
	'number': /[\d%\.]+/
});
/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 * 		- Extends clike syntax
 * 		- Support for PHP 5.3+ (namespaces, traits, generators, etc)
 * 		- Smarter constant and function matching
 *
 * Adds the following new token classes:
 * 		constant, delimiter, variable, function, package
 */

Prism.languages.php = Prism.languages.extend('clike', {
	'keyword': /\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,
	'constant': /\b[A-Z0-9_]{2,}\b/,
	'comment': {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
		lookbehind: true
	}
});

// Shell-like comments are matched after strings, because they are less
// common than strings containing hashes...
Prism.languages.insertBefore('php', 'class-name', {
	'shell-comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true,
		alias: 'comment'
	}
});

Prism.languages.insertBefore('php', 'keyword', {
	'delimiter': {
		pattern: /\?>|<\?(?:php|=)?/i,
		alias: 'important'
	},
	'variable': /\$\w+\b/i,
	'package': {
		pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
		lookbehind: true,
		inside: {
			punctuation: /\\/
		}
	}
});

// Must be defined after the function pattern
Prism.languages.insertBefore('php', 'operator', {
	'property': {
		pattern: /(->)[\w]+/,
		lookbehind: true
	}
});

// Add HTML support if the markup language exists
if (Prism.languages.markup) {

	// Tokenize all inline PHP blocks that are wrapped in <?php ?>
	// This allows for easy PHP + markup highlighting
	Prism.hooks.add('before-highlight', (function (env) {
		if (env.language !== 'php' || !/(?:<\?php|<\?)/ig.test(env.code)) {
			return;
		}

		env.tokenStack = [];

		env.backupCode = env.code;
		env.code = env.code.replace(/(?:<\?php|<\?)[\s\S]*?(?:\?>|$)/ig, (function (match) {
			var i = env.tokenStack.length;
			// Check for existing strings
			while (env.backupCode.indexOf('___PHP' + i + '___') !== -1)
				++i;

			// Create a sparse array
			env.tokenStack[i] = match;

			return '___PHP' + i + '___';
		}));

		// Switch the grammar to markup
		env.grammar = Prism.languages.markup;
	}));

	// Restore env.code for other plugins (e.g. line-numbers)
	Prism.hooks.add('before-insert', (function (env) {
		if (env.language === 'php' && env.backupCode) {
			env.code = env.backupCode;
			delete env.backupCode;
		}
	}));

	// Re-insert the tokens after highlighting
	Prism.hooks.add('after-highlight', (function (env) {
		if (env.language !== 'php' || !env.tokenStack) {
			return;
		}

		// Switch the grammar back
		env.grammar = Prism.languages.php;

		for (var i = 0, keys = Object.keys(env.tokenStack); i < keys.length; ++i) {
			var k = keys[i];
			var t = env.tokenStack[k];

			// The replace prevents $$, $&, $`, $', $n, $nn from being interpreted as special patterns
			env.highlightedCode = env.highlightedCode.replace('___PHP' + k + '___',
				"<span class=\"token php language-php\">" +
				Prism.highlight(t, env.grammar, 'php').replace(/\$/g, '$$$$') +
				"</span>");
		}

		env.element.innerHTML = env.highlightedCode;
	}));
}
;
Prism.languages.insertBefore('php', 'variable', {
	'this': /\$this\b/,
	'global': /\$(?:_(?:SERVER|GET|POST|FILES|REQUEST|SESSION|ENV|COOKIE)|GLOBALS|HTTP_RAW_POST_DATA|argc|argv|php_errormsg|http_response_header)/,
	'scope': {
		pattern: /\b[\w\\]+::/,
		inside: {
			keyword: /(static|self|parent)/,
			punctuation: /(::|\\)/
		}
	}
});
Prism.languages.scss = Prism.languages.extend('css', {
	'comment': {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
		lookbehind: true
	},
	'atrule': {
		pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	// url, compassified
	'url': /(?:[-a-z]+-)*url(?=\()/i,
	// CSS selector regex is not appropriate for Sass
	// since there can be lot more things (var, @ directive, nesting..)
	// a selector must start at the end of a property or after a brace (end of other rules or nesting)
	// it can contain some characters that aren't used for defining rules or end of selector, & (parent selector), or interpolated variable
	// the end of a selector is found when there is no rules in it ( {} or {\s}) or if there is a property (because an interpolated var
	// can "pass" as a selector- e.g: proper#{$erty})
	// this one was hard to do, so please be careful if you edit this one :)
	'selector': {
		// Initial look-ahead is used to prevent matching of blank selectors
		pattern: /(?=\S)[^@;\{\}\(\)]?([^@;\{\}\(\)]|&|#\{\$[-_\w]+\})+(?=\s*\{(\}|\s|[^\}]+(:|\{)[^\}]+))/m,
		inside: {
			'parent': {
				pattern: /&/,
				alias: 'important'
			},
			'placeholder': /%[-_\w]+/,
			'variable': /\$[-_\w]+|#\{\$[-_\w]+\}/
		}
	}
});

Prism.languages.insertBefore('scss', 'atrule', {
	'keyword': [
		/@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
		{
			pattern: /( +)(?:from|through)(?= )/,
			lookbehind: true
		}
	]
});

Prism.languages.scss.property = {
	pattern: /(?:[\w-]|\$[-_\w]+|#\{\$[-_\w]+\})+(?=\s*:)/i,
	inside: {
		'variable': /\$[-_\w]+|#\{\$[-_\w]+\}/
	}
};

Prism.languages.insertBefore('scss', 'important', {
	// var and interpolated vars
	'variable': /\$[-_\w]+|#\{\$[-_\w]+\}/
});

Prism.languages.insertBefore('scss', 'function', {
	'placeholder': {
		pattern: /%[-_\w]+/,
		alias: 'selector'
	},
	'statement': {
		pattern: /\B!(?:default|optional)\b/i,
		alias: 'keyword'
	},
	'boolean': /\b(?:true|false)\b/,
	'null': /\bnull\b/,
	'operator': {
		pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
		lookbehind: true
	}
});

Prism.languages.scss['atrule'].inside.rest = Prism.util.clone(Prism.languages.scss);
/* jshint ignore:end */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.xray = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, (function (root) {

	'use strict';

	//
	// Variables
	//

	var xray = {}; // Object for public APIs
	var supports = 'querySelector' in document && 'addEventListener' in root && 'classList' in document.createElement('_'); // Feature test
	var settings, toggles;

	// Default settings
	var defaults = {
		selector: '[data-x-ray]',
		selectorShow: '[data-x-ray-show]',
		selectorHide: '[data-x-ray-hide]',
		toggleActiveClass: 'active',
		initClass: 'js-x-ray',
		callback: function () {}
	};


	//
	// Methods
	//

	/**
	 * A simple forEach() implementation for Arrays, Objects and NodeLists.
	 * @private
	 * @author Todd Motto
	 * @link   https://github.com/toddmotto/foreach
	 * @param {Array|Object|NodeList} collection Collection of items to iterate
	 * @param {Function}              callback   Callback function for each iteration
	 * @param {Array|Object|NodeList} scope      Object/NodeList/Array that forEach is iterating over (aka `this`)
	 */
	var forEach = function ( collection, callback, scope ) {
		if ( Object.prototype.toString.call( collection ) === '[object Object]' ) {
			for ( var prop in collection ) {
				if ( Object.prototype.hasOwnProperty.call( collection, prop ) ) {
					callback.call( scope, collection[prop], prop, collection );
				}
			}
		} else {
			for ( var i = 0, len = collection.length; i < len; i++ ) {
				callback.call( scope, collection[i], i, collection );
			}
		}
	};

	/**
	 * Merge two or more objects. Returns a new object.
	 * @private
	 * @param {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
	 * @param {Object}   objects  The objects to merge together
	 * @returns {Object}          Merged values of defaults and options
	 */
	var extend = function () {

		// Variables
		var extended = {};
		var deep = false;
		var i = 0;
		var length = arguments.length;

		// Check if a deep merge
		if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
			deep = arguments[0];
			i++;
		}

		// Merge the object into the extended object
		var merge = function (obj) {
			for ( var prop in obj ) {
				if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
					// If deep merge and property is an object, merge properties
					if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
						extended[prop] = extend( true, extended[prop], obj[prop] );
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};

		// Loop through each object and conduct a merge
		for ( ; i < length; i++ ) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;

	};

	/**
	 * Get the closest matching element up the DOM tree.
	 * @private
	 * @param  {Element} elem     Starting element
	 * @param  {String}  selector Selector to match against
	 * @return {Boolean|Element}  Returns null if not match found
	 */
	var getClosest = function ( elem, selector ) {

		// Element.matches() polyfill
		if (!Element.prototype.matches) {
			Element.prototype.matches =
				Element.prototype.matchesSelector ||
				Element.prototype.mozMatchesSelector ||
				Element.prototype.msMatchesSelector ||
				Element.prototype.oMatchesSelector ||
				Element.prototype.webkitMatchesSelector ||
				function(s) {
					var matches = (this.document || this.ownerDocument).querySelectorAll(s),
						i = matches.length;
					while (--i >= 0 && matches.item(i) !== this) {}
					return i > -1;
				};
		}

		// Get closest match
		for ( ; elem && elem !== document; elem = elem.parentNode ) {
			if ( elem.matches( selector ) ) return elem;
		}

		return null;

	};

	/**
	 * Toggle password visibility
	 * @private
	 * @param  {NodeList} pws Password fields to toggle
	 */
	var togglePW = function ( pws ) {
		forEach(pws, (function (pw) {
			var pwType = pw.type.toLowerCase();
			if ( pwType === 'password' ) {
				pw.type = 'text';
			} else if ( pwType === 'text' ) {
				pw.type = 'password';
			}
		}));
	};

	/**
	 * Load default visibility
	 * @private
	 * @param  {Element} toggle The element that toggles password visibility
	 * @param  {String} visibility Should the password be visible or hidden by default?
	 * @param  {String} pwSelector ID of the password field
	 * @param  {Object} settings
	 */
	var loadDefaultVisibility = function ( toggle, visibility, pwSelector, settings ) {
		var showText = toggle.querySelector( settings.selectorShow );
		var hideText = toggle.querySelector( settings.selectorHide );
		var pws = document.querySelectorAll(pwSelector);
		if ( visibility === 'show' ) {
			togglePW(pws);
			if ( hideText ) {
				hideText.classList.add( settings.toggleActiveClass );
			}
		} else {
			if ( showText ) {
				showText.classList.add( settings.toggleActiveClass );
			}
		}
	};

	/**
	 * Update toggle text
	 * @private
	 * @param  {Element} toggle The element that toggles password visibility
	 * @param  {Object} settings
	 */
	var updateToggleText = function ( toggle, settings ) {
		var showText = toggle.querySelector('.x-ray-show');
		var hideText = toggle.querySelector('.x-ray-hide');
		if ( hideText ) {
			hideText.classList.toggle( settings.toggleActiveClass );
		}
		if ( showText ) {
			showText.classList.toggle( settings.toggleActiveClass );
		}
	};

	/**
	 * Show or hide password visibility
	 * @public
	 * @param  {Element} toggle The element that toggles password visibility
	 * @param  {String} pwSelector The selector for the password fields
	 * @param  {Object} options
	 * @param  {Event} event
	 */
	xray.runToggle = function ( toggle, pwSelector, options, event ) {

		// Selectors and variables
		var settings = extend( settings || defaults, options || {} );  // Merge user options with defaults
		var pws = document.querySelectorAll( pwSelector );

		togglePW( pws ); // Show/Hide password
		updateToggleText( toggle, settings ); // Change the toggle text

		settings.callback( toggle, pwSelector ); // Run callbacks after password visibility toggle

	};

	/**
	 * Handle toggle click events
	 * @private
	 */
	var eventHandler = function (event) {
		var toggle = getClosest( event.target, settings.selector );
		if ( toggle ) {
			if ( toggle.tagName.toLowerCase() === 'a' || toggle.tagName.toLowerCase() === 'button' ) {
				event.preventDefault();
			}
			xray.runToggle( toggle, toggle.getAttribute('data-x-ray'), settings );
		}
	};

	/**
	 * Destroy the current initialization.
	 * @public
	 */
	xray.destroy = function () {
		if ( !settings ) return;
		document.documentElement.classList.remove( settings.initClass );
		document.removeEventListener('click', eventHandler, false);
		if ( toggles ) {
			forEach( toggles, (function ( toggle ) {

				// Get elements
				var pws = document.querySelectorAll( toggle.getAttribute('data-x-ray') );
				var showText = toggle.querySelector( settings.selectorShow );
				var hideText = toggle.querySelector( settings.selectorHide );

				// Reset to default password state
				forEach( pws, (function ( pw ) {
					pw.type = 'password';
				}));
				showText.classList.remove(settings.toggleActiveClass);
				hideText.classList.remove(settings.toggleActiveClass);

			}));
		}
		settings = null;
		toggles = null;
	};

	/**
	 * Initialize X-Ray
	 * @public
	 * @param {Object} options User settings
	 */
	xray.init = function ( options ) {

		// feature test
		if ( !supports ) return;

		// Destroy any existing initializations
		xray.destroy();

		// Selectors and variables
		settings = extend( defaults, options || {} ); // Merge user options with defaults
		toggles = document.querySelectorAll( settings.selector ); // Get show/hide password toggles

		document.documentElement.classList.add( settings.initClass ); // Add class to HTML element to activate conditional CSS

		// Initialize password visibility defaults
		forEach(toggles, (function (toggle, index) {
			var visibility = toggle.getAttribute('data-default');
			var pwID = toggle.getAttribute('data-x-ray');
			loadDefaultVisibility( toggle, visibility, pwID, settings );
		}));

		// Listen for click events
		document.addEventListener('click', eventHandler, false);

	};


	//
	// Public APIs
	//

	return xray;

}));
/**
 * Script initializations
 */

// Responsive iframe videos
fluidvids.init({
	selector: ['iframe', 'object'],
	players: ['www.youtube.com', 'player.vimeo.com']
});

// Load app
app();

// Toggle password visibility
xray.init();