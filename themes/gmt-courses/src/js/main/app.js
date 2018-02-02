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

	var getAjax = function (data, callback) {
		atomic.ajax({
			type: 'POST',
			url: baseURL + '/manage-account/wp-admin/admin-ajax.php',
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

	var renderDashboard = function (content) {
		var courses = getCourses();
		if (!courses) {
			content.innerHTML = '<ul><li>You don\'t have any courses yet.</li></ul>';
			return;
		}
		var courseList = '';
		courses.forEach(function (course) {
			courseList += '<li id="' + course.id + '"><a href="' + course.url + '">' + course.title + '</a></li>';
		});
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
		resources.forEach(function (resource) {
			resourceList += '<li><a href="' + resource.url + '">' + resource.title + '</a></li>';
		});
		content.innerHTML = '<ul>' + resourceList + '</ul>';
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
			getAjax({action: 'gmt_courses_is_logged_in'}, function (data) {
				if (data.code === 200) {
					document.documentElement.className += ' logged-in';
					fetchCourses();
				}
			});
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