/**
 * Run the web app
 */
var app = function () {

	'use strict';

	//
	// Variables
	//

	// var baseURL = 'https://courses.gomakethings.com/controller/wp-admin/admin-ajax.php';
	var baseURL = 'http://localhost:8888/go-make-things-courses/public/manage-account/wp-admin/admin-ajax.php';


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

	/**
	 * Decode HTML entities from an encoded string
	 * https://stackoverflow.com/a/7394787/1293256
	 * @param  {String} html The encoded HTML string
	 * @return {String}      A decoded HTML string
	 */
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
		return data.data.courses.find(function (course) {
			return parseInt(course.id, 10) === id;
		});
	};

	var getLesson = function (courseID, lessonID) {
		var course = getCourse(courseID);
		if (!course) return;
		return course.lessons.find(function (lesson) {
			return lesson.id === lessonID;
		});
	};

	var getSessions = function () {
		var data = getData();
		if (!data) return;
		return data.data.academy;
	};

	var getSession = function (id) {
		var data = getData();
		id = parseInt(id, 10);
		if (!data) return;
		return data.data.academy.find(function (session) {
			return parseInt(session.id, 10) === id;
		});
	};

	var getAcademy = function (sessionID, academyID) {
		var session = getSession(sessionID);
		if (!session) return;
		return session.lessons.find(function (lesson) {
			return lesson.id === academyID;
		});
	};

	var getAjax = function (data, callback) {
		atomic.ajax({
			type: 'POST',
			url: baseURL,
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			},
			data: data
		}).success(function (data) {
			callback(data);
		});
	};

	var renderNoAccess = function (content) {
		content.innerHTML = '<p>You do not have access to this content. Sorry!</p>';
	};

	var buildContentList = function (items) {
		var list = '';
		items.forEach(function (item) {
			list += '<li' + (item.id ? ' id="' + item.id + '"' : '') + '><a href="' + item.url + '">' + item.title + '</a></li>';
		});
		return list;
	};

	var renderDashboard = function (content) {
		var sessions = getSessions();
		var courses = getCourses();
		var resources = getResources();
		var dashboard = '';

		// Build Academy sessions list
		if (sessions.length > 0) {
			dashboard +=
				'<h2><svg style="height:.9em;width:.9em;margin-bottom:-2px;" viewBox="0 0 133 132" xmlns="http://www.w3.org/2000/svg"><title></title><g transform="translate(4 3)" stroke="currentColor" fill="none" fill-rule="evenodd"><ellipse stroke-width="10" cx="62.5" cy="62.714" rx="46.651" ry="46.659"></ellipse><path d="M62.5 1.41v123.54M124.217 64.4H.783M106.178 19.503l-87.356 87.355M105.279 107.683L17.997 20.402" stroke-width="8" stroke-linecap="round"></path></g></svg> Vanilla JS Academy</h2>' +
				'<ul>' +
					buildContentList(sessions) +
				'</ul>';
		}

		// Build courses list
		if (courses.length > 0) {
			dashboard +=
				'<h2><svg style="height:.8em;width:.75em;" viewBox="0 0 83 89" xmlns="http://www.w3.org/2000/svg"><title></title><path d="M16.075 49l1.551-9H13v-7h5.5V21H14L33 0l19 21h-4v12h5v7h-4.657l5.091 32h.066v.413l1.67 10.497c1.899.626 2.954.934 4.109 1.176.993.207 1.888.312 2.721.312h2v4h-2c-1.129 0-2.292-.137-3.539-.397-1.415-.295-2.63-.657-4.88-1.403C49.825 85.352 48.469 85 46.883 85c-1.586 0-3.024.389-6.372 1.583-3.799 1.355-5.503 1.815-7.716 1.815-2.396 0-4.136-.465-7.868-1.819C21.63 85.384 20.195 85 18.422 85c-1.378 0-3.464.319-6.022.893-.966.217-1.981.466-3.03.74a120.89 120.89 0 0 0-5.754 1.668l-1.902.616L.48 85.112l1.903-.616.478-.152a124.843 124.843 0 0 1 5.493-1.58c.676-.177 1.34-.344 1.99-.5L12 72.656V72h.113L16 49.438V49h.075zm1.82 13l-1.723 10h33.212l-1.591-10H17.895zm2.24-13h25.59l-1.432-9H21.685l-1.55 9zM44 21H22.5v12H44V21zm35.328-7.497l1.17 3.825L58.5 24.05l-1.169-3.825 21.996-6.721zm1.17 23.169l-1.17 3.825-21.996-6.72 1.17-3.826 21.995 6.72zM83 25v4H65v-4h18z" fill-rule="nonzero" fill="currentColor"></path></svg> Pocket Guides</h2>' +
				'<p>The video courses are still in development, and are being released on a rolling basis.</p>' +
				'<ol>' +
					buildContentList(courses) +
				'</ol>';
		}

		// Build resource list
		if (resources.length > 0) {
			dashboard +=
				'<h2><svg xmlns="http://www.w3.org/2000/svg" style="height:.8em;width:.8em" viewBox="0 0 16 16"><title></title><path fill="currentColor" d="M13 6.5a3.506 3.506 0 0 0-2.004-3.164C10.91 1.482 9.375 0 7.5 0S4.09 1.482 4.004 3.336A3.504 3.504 0 0 0 2 6.5c0 1.446.882 2.69 2.136 3.223l2.915 5.996a.5.5 0 0 0 .9 0l2.915-5.996A3.506 3.506 0 0 0 13.002 6.5zM9.5 9h-4C4.122 9 3 7.878 3 6.5a2.503 2.503 0 0 1 3.333-2.358.5.5 0 1 0 .333-.943 3.499 3.499 0 0 0-1.622-.169A2.504 2.504 0 0 1 7.499 1a2.502 2.502 0 0 1 1.863 4.167.5.5 0 1 0 .745.666c.367-.41.629-.897.77-1.419A2.506 2.506 0 0 1 11.998 6.5c0 1.378-1.121 2.5-2.5 2.5z"></path></svg> Resources</h2>' +
				'<ul>' +
					buildContentList(resources) +
				'</ul>';
		}

		// If no content
		if (dashboard.length < 1) {
			dashboard = '<p>You don\'t have any content yet.</p>';
		}

		content.innerHTML = dashboard;
	};

	var buildLessonList = function (course, current) {

		// If no lessons, return an empty string
		if (!course || !Array.isArray(course.lessons) || course.lessons.length < 1) return '';

		// Variables
		var section = '';
		var nav = '<h2>Lessons</h2>';

		course.lessons.forEach(function (lesson, index) {
			if (section !== lesson.section) {
				nav += (section === '' ? '' : '</ol>') + '<h3 class="h5 no-padding-top margin-bottom-small">' + lesson.section + '</h3><ol start="' + (index + 1) + '">';
			}
			nav += current && current === lesson.id ? '<li><span class="text-muted">' + lesson.title + '</span></li>' : '<li><a href="' + lesson.url + '">' + lesson.title + '</a></li>';
			section = lesson.section;
		});
		nav += '</ol>';

		return nav;

	};

	var buildLessonAssets = function (course) {

		// If no course assets, return an empty string
		var hasSource = course.sourceCode && course.sourceCode.length > 1;
		var hasAssets = course.assets && Object.keys(course.assets).length > 0;
		if (!course || (!hasSource && !hasAssets)) return '';

		// Create heading
		var assets = '<h2>Assets</h2><ul>';

		// Add source code link
		if (hasSource) {
			assets += '<li><strong><a href="' + course.sourceCode + '"><svg xmlns="http://www.w3.org/2000/svg" style="height:1em;width:1em;" viewBox="0 0 16 16"><title></title><path fill="currentColor" d="M8 .198a8 8 0 0 0-2.529 15.591c.4.074.547-.174.547-.385 0-.191-.008-.821-.011-1.489-2.226.484-2.695-.944-2.695-.944-.364-.925-.888-1.171-.888-1.171-.726-.497.055-.486.055-.486.803.056 1.226.824 1.226.824.714 1.223 1.872.869 2.328.665.072-.517.279-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.954 0-.873.313-1.587.824-2.147-.083-.202-.357-1.015.077-2.117 0 0 .672-.215 2.201.82A7.672 7.672 0 0 1 8 4.066c.68.003 1.365.092 2.004.269 1.527-1.035 2.198-.82 2.198-.82.435 1.102.162 1.916.079 2.117.513.56.823 1.274.823 2.147 0 3.073-1.872 3.749-3.653 3.947.287.248.543.735.543 1.481 0 1.07-.009 1.932-.009 2.195 0 .213.144.462.55.384A8 8 0 0 0 8.001.196z"/></svg> Source Code</a></strong></li>';
		}

		// Add asset links
		if (hasAssets) {
			assets +=
				'<li>' +
					'<strong>Pocket Guides</strong>' +
					'<ul>' +
						(course.assets.all ? '<li><a href="' + course.assets.all + '">All Files</a></li>' : '') +
						(course.assets.pdf ? '<li><a href="' + course.assets.pdf + '" download>PDF</a></li>' : '') +
						(course.assets.epub ?'<li><a href="' + course.assets.epub + '" download>EPUB</a></li>' : '') +
						(course.assets.mobi ? '<li><a href="' + course.assets.mobi + '" download>MOBI</a></li>' : '') +
						(course.assets.html ? '<li><a href="' + course.assets.html + '" download>HTML</a></li>' : '') +
					'</ul>' +
				'</li>';
		}

		// Close out list
		assets += '</ul>';

		return assets;

	};

	var buildCourseNav = function (course, current) {
		return buildLessonList(course, current) + buildLessonAssets(course);
	};

	var renderCourse = function (content) {
		var course = getCourse(content.getAttribute('data-course'));
		if (!course) {
			content.innerHTML = '<p>You do not have access to this content. Sorry!</p>';
			return;
		}

		// Render course navigation
		content.innerHTML = buildCourseNav(course);
	};

	var renderLesson = function (content) {
		var lesson = getLesson(content.getAttribute('data-course'), content.getAttribute('data-lesson'));
		var course = getCourse(content.getAttribute('data-course'));
		if (!lesson || !course) {
			renderNoAccess(content);
			return;
		}
		var next = content.getAttribute('data-lesson-next');
		var prev = content.getAttribute('data-lesson-prev');
		content.innerHTML =
			'<iframe src="https://player.vimeo.com/video/' + lesson.video + '?title=0&byline=0&portrait=0&autoplay=1" width="640" height="388" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>' +
			'<div class="clearfix margin-bottom">' +
				( next ? '<a class="btn float-right" href="' + next + '#play">Next Lesson &rarr;</a>' : '' ) +
				( prev ? '<a href="' + prev + '#play">&larr; Previous Lesson</a>' : '' ) +
			'</div>' +
			buildCourseNav(course, lesson.id);
		fluidvids.render();
	};

	var buildSessionNav = function (session, current) {
		return buildLessonList(session, current);
	};

	var renderSession = function (content) {
		var session = getSession(content.getAttribute('data-session'));
		if (!session) {
			content.innerHTML = '<p>You do not have access to this content. Sorry!</p>';
			return;
		}

		// Render session navigation
		content.innerHTML = buildSessionNav(session);
	};

	var renderAcademy = function (content) {
		var lesson = getAcademy(content.getAttribute('data-session'), content.getAttribute('data-academy'));
		var session = getSession(content.getAttribute('data-session'));
		if (!lesson || !session) {
			renderNoAccess(content);
			return;
		}
		var next = content.getAttribute('data-lesson-next');
		var prev = content.getAttribute('data-lesson-prev');
		content.innerHTML =
			decodeHTML(lesson.content) +
			(lesson.sourceCode.length > 0 ? '<p class="padding-top-small"><strong><a href="' + lesson.sourceCode + '"><svg xmlns="http://www.w3.org/2000/svg" style="height:1em;width:1em;" viewBox="0 0 16 16"><title></title><path fill="currentColor" d="M8 .198a8 8 0 0 0-2.529 15.591c.4.074.547-.174.547-.385 0-.191-.008-.821-.011-1.489-2.226.484-2.695-.944-2.695-.944-.364-.925-.888-1.171-.888-1.171-.726-.497.055-.486.055-.486.803.056 1.226.824 1.226.824.714 1.223 1.872.869 2.328.665.072-.517.279-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.954 0-.873.313-1.587.824-2.147-.083-.202-.357-1.015.077-2.117 0 0 .672-.215 2.201.82A7.672 7.672 0 0 1 8 4.066c.68.003 1.365.092 2.004.269 1.527-1.035 2.198-.82 2.198-.82.435 1.102.162 1.916.079 2.117.513.56.823 1.274.823 2.147 0 3.073-1.872 3.749-3.653 3.947.287.248.543.735.543 1.481 0 1.07-.009 1.932-.009 2.195 0 .213.144.462.55.384A8 8 0 0 0 8.001.196z"/></svg> Source Code</a></strong></p>' : '') +
			'<div class="clearfix padding-top-small margin-bottom">' +
				( next ? '<a class="btn float-right" href="' + next + '#play">Next Lesson &rarr;</a>' : '' ) +
				( prev ? '<a href="' + prev + '#play">&larr; Previous Lesson</a>' : '' ) +
			'</div>' +
			buildSessionNav(session, lesson.id);
		fluidvids.render();
	};

	/**
	 * Render the password reset page
	 */
	var renderPasswordReset = function () {

		if (!document.querySelector('#reset-user-password')) return;

		// Variables
		var params = getParams(window.location.href);
		var lost = document.querySelector('#lost-password');
		var reset = document.querySelector('#reset-password');
		var placeholder = document.querySelector('#password-reset-placeholder');
		if (!lost || !reset || !placeholder) return;

		// If this is a reset link, validate the reset key
		if (params.email && params.key) {
			getAjax({
				action: 'gmt_courses_is_reset_key_valid',
				username: params.email,
				key: params.key
			}, function (data) {

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

			});
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
		} else if (type === 'course') {
			renderCourse(content);
		} else if (type === 'academy') {
			renderAcademy(content);
		} else if (type === 'session') {
			renderSession(content);
		}

		// Rehighlight code
		Prism.highlightAll();

	};

	var fetchCourses = function () {
		getAjax({action: 'gmt_courses_get_courses'}, function (data) {
			if (data.code === 200) {
				setData(data.data);
				render();
			} else {
				console.log('fetchCourses failed: ' + data.message);
			}
		});
	};

	var disableButton = function () {
		var btns = document.querySelectorAll('[data-submit]');
		btns.forEach(function (btn) {
			var processing = btn.getAttribute('data-processing');
			if (processing) {
				btn.setAttribute('data-original', btn.innerHTML);
				btn.innerHTML = processing;
			}
			btn.setAttribute('disabled', 'disabled');
		});
	};

	var enableButton = function () {
		var btns = document.querySelectorAll('[data-submit]');
		btns.forEach(function (btn) {
			var original = btn.getAttribute('data-original');
			if (original) {
				btn.innerHTML = original;
			}
			btn.removeAttribute('disabled');
		});
	};

	var throwFormError = function (msg, success) {
		var errors = document.querySelectorAll('[data-form-error]');
		errors.forEach(function (error) {
			error.innerHTML = msg;
			error.className = success ? 'success-message' : 'error-message';
		});
	};

	var clearFormError = function () {
		var errors = document.querySelectorAll('[data-form-error]');
		errors.forEach(function (error) {
			error.innerHTML = '';
			error.className = '';
		});
	};

	var processLogin = function (form) {
		var email = form.querySelector('#email');
		var pw = form.querySelector('#password');
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
		}, function (data) {
			enableButton();
			if (data.code === 200) {
				document.documentElement.className += ' logged-in';
				fetchCourses();
			} else {
				throwFormError(data.message);
			}
		});
	};

	var processJoin = function (form) {
		var email = form.querySelector('#email');
		var pw = form.querySelector('#password');
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
		}, function (data) {
			enableButton();
			if (data.code === 200) {
				form.parentNode.innerHTML = '<p>' + data.message + '</p>';
			} else {
				throwFormError(data.message);
			}
		});
	};

	var processChangePW = function (form) {
		var currentPW = form.querySelector('#current-password');
		var newPW = form.querySelector('#new-password');
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
		}, function (data) {
			enableButton();
			if (data.code === 200) {
				throwFormError(data.message, true);
				currentPW.value = '';
				newPW.value = '';
			} else {
				throwFormError(data.message);
			}
		});
	};

	var processLostPW = function (form) {
		var email = form.querySelector('#email');
		if (!email || email.value.length < 1) {
			throwFormError('Please enter your email address.');
			return;
		}
		disableButton();
		clearFormError();
		getAjax({
			action: 'gmt_courses_lost_password',
			username: email.value
		}, function (data) {
			enableButton();
			if (data.code === 200) {
				form.parentNode.innerHTML = data.message;
			} else {
				throwFormError(data.message);
			}
		});
	};

	var processResetPW = function (form) {
		var password = form.querySelector('#password');
		var params = getParams(window.location.href);
		if (!password || password.value.length < 1) {
			throwFormError('Please enter a new password.');
			return;
		}
		disableButton();
		clearFormError();
		getAjax({
			action: 'gmt_courses_reset_password',
			username: params.email,
			key: params.key,
			password: password.value
		}, function (data) {
			enableButton();
			if (data.code === 200 || data.code === 205) {
				form.parentNode.innerHTML = data.message;
				if (data.code === 200) {
					document.documentElement.className += ' logged-in';
				}
			} else {
				throwFormError(data.message);
			}
		});
	};

	var validate = function () {
		if (!document.querySelector('#validate-user')) return;
		var params = getParams(window.location.href);
		if (!params.email || !params.key) return;
		getAjax({
			action: 'gmt_courses_validate_new_account',
			username: params.email,
			key: params.key
		}, function (data) {
			var success = data.code === 200 ? true : false;
			throwFormError(data.message, success);
		});
	};

	var logoutHandler = function (event) {
		if (!event.target.matches('#logout')) return;
		event.preventDefault();
		event.target.parentNode.innerHTML = '<span class="text-muted">Logging out...</span>';
		getAjax({action: 'gmt_courses_logout'}, function (data) {
			sessionStorage.removeItem('gmtCoursesLoggedIn');
			window.location.reload();
		});
	};

	var formHandler = function (event) {

		// Login
		if (event.target.matches('#login-form')) {
			event.preventDefault();
			processLogin(event.target);
		}

		// Join
		else if (event.target.matches('#join-form')) {
			event.preventDefault();
			processJoin(event.target);
		}

		// Change password
		else if (event.target.matches('#change-password-form')) {
			event.preventDefault();
			processChangePW(event.target);
		}

		// Lost password
		else if (event.target.matches('#lost-password-form')) {
			event.preventDefault();
			processLostPW(event.target);
		}

		// Reset password
		else if (event.target.matches('#reset-password-form')) {
			event.preventDefault();
			processResetPW(event.target);
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
			getAjax({action: 'gmt_courses_is_logged_in'}, function (data) {
				if (data.code === 200) {
					document.documentElement.className += ' logged-in';
					fetchCourses();
				}
			});
			validate();
			renderPasswordReset();
		}
	};


	//
	// Event Listeners & Inits
	//

	document.addEventListener('submit', formHandler, false);
	document.addEventListener('click', logoutHandler, false);
	loadApp();

};